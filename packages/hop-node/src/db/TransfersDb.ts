import TimestampedKeysDb from './TimestampedKeysDb'
import chainIdToSlug from 'src/utils/chainIdToSlug'
import { BigNumber } from 'ethers'
import { KeyFilter } from './BaseDb'
import { OneWeekMs, TxError, TxRetryDelayMs } from 'src/constants'
import { normalizeDbItem } from './utils'

export type TransfersDateFilter = {
  fromUnix?: number
  toUnix?: number
}

export type Transfer = {
  transferRootId?: string
  transferRootHash?: string
  transferId?: string
  destinationChainId?: number
  destinationChainSlug?: string
  sourceChainId?: number
  sourceChainSlug?: string
  withdrawalBondSettled?: boolean
  withdrawalBonded?: boolean
  withdrawalBonder?: string
  withdrawalBondTxError?: TxError
  withdrawalBondBackoffIndex?: number
  bondWithdrawalAttemptedAt?: number
  isTransferSpent?: boolean
  transferSpentTxHash?: string

  recipient?: string
  amount?: BigNumber
  amountOutMin?: BigNumber
  bonderFee?: BigNumber
  transferNonce?: string
  deadline?: number
  transferSentTimestamp?: number
  transferSentTxHash?: string
  transferSentBlockNumber?: number
  transferSentIndex?: number

  isBondable?: boolean
  committed: boolean
}

class TransfersDb extends TimestampedKeysDb<Transfer> {
  async trackTimestampedKey (transfer: Partial<Transfer>) {
    const data = await this.getTimestampedKeyValueForUpdate(transfer)
    if (data) {
      const key = data?.key
      const transferId = data?.value?.transferId
      this.logger.debug(`storing timestamped key. key: ${key} transferId: ${transferId}`)
      const value = { transferId }
      await this.subDb._update(key, value)
    }
  }

  async trackTimestampedKeyByTransferId (transferId: string) {
    const transfer = await this.getByTransferId(transferId)
    return this.trackTimestampedKey(transfer)
  }

  getTimestampedKey (transfer: Partial<Transfer>) {
    if (transfer?.transferSentTimestamp && transfer?.transferId) {
      const key = `transfer:${transfer?.transferSentTimestamp}:${transfer?.transferId}`
      return key
    }
  }

  async getTimestampedKeyValueForUpdate (transfer: Partial<Transfer>) {
    if (!transfer) {
      this.logger.warn('expected transfer object for timestamped key')
      return
    }
    const transferId = transfer?.transferId
    const key = this.getTimestampedKey(transfer)
    if (!key) {
      this.logger.warn('expected timestamped key. incomplete transfer:', JSON.stringify(transfer))
      return
    }
    if (!transferId) {
      this.logger.warn(`expected transfer id for timestamped key. key: ${key} incomplete transfer: `, JSON.stringify(transfer))
      return
    }
    const item = await this.subDb.getById(key)
    const exists = !!item
    if (!exists) {
      const value = { transferId }
      return { key, value }
    }
  }

  async update (transferId: string, transfer: Partial<Transfer>) {
    const logger = this.logger.create({ id: transferId })
    logger.debug('update called')
    const timestampedKv = await this.getTimestampedKeyValueForUpdate(transfer)
    if (timestampedKv) {
      logger.debug(`storing timestamped key. key: ${timestampedKv.key} transferId: ${transferId}`)
      await this.subDb._update(timestampedKv.key, timestampedKv.value)
      logger.debug(`updated db item. key: ${timestampedKv.key}`)
    }
    await this._update(transferId, transfer)
    const entry = await this.getById(transferId)
    logger.debug(`updated db transfer item. ${JSON.stringify(entry)}`)
  }

  normalizeItem (transferId: string, item: Partial<Transfer>) {
    if (!item) {
      return null
    }
    if (!item?.transferId) {
      item.transferId = transferId
    }
    if (item?.destinationChainId) {
      item.destinationChainSlug = chainIdToSlug(item?.destinationChainId)
    }
    if (item?.sourceChainId) {
      item.sourceChainSlug = chainIdToSlug(item.sourceChainId)
    }
    return normalizeDbItem(item)
  }

  async getByTransferId (transferId: string): Promise<Transfer> {
    const item : Transfer = await this.getById(transferId)
    return this.normalizeItem(transferId, item)
  }

  async getTransferIds (dateFilter?: TransfersDateFilter): Promise<string[]> {
    // return only transfer-id keys that are within specified range (filter by timestamped keys)
    if (dateFilter) {
      const filter : KeyFilter = {}
      if (dateFilter.fromUnix) {
        filter.gte = `transfer:${dateFilter.fromUnix}`
      }
      if (dateFilter.toUnix) {
        filter.lte = `transfer:${dateFilter.toUnix}~` // tilde is intentional
      }
      const kv = await this.subDb.getKeyValues(filter)
      return kv.map((x: any) => x?.value?.transferId).filter((x: any) => x)
    }

    // return all transfer-id keys if no filter is used (filter out timestamped keys)
    const keys = (await this.getKeys()).filter((key: string) => !key?.startsWith('transfer:'))
    return this.batchGetByIds(keys)
  }

  async getItems (dateFilter?: TransfersDateFilter): Promise<Transfer[]> {
    const transferIds = await this.getTransferIds(dateFilter)
    this.logger.debug(`transferIds length: ${transferIds.length}`)

    const transfers = await Promise.all(
      transferIds.map(transferId => {
        return this.getByTransferId(transferId)
      })
    )

    // sort explainer: https://stackoverflow.com/a/9175783/1439168
    const items = transfers
      .filter(x => x)
      .sort((a, b) => {
        if (a.transferSentBlockNumber > b.transferSentBlockNumber) return 1
        if (a.transferSentBlockNumber < b.transferSentBlockNumber) return -1
        if (a.transferSentIndex > b.transferSentIndex) return 1
        if (a.transferSentIndex < b.transferSentIndex) return -1
        return 0
      })

    this.logger.debug(`items length: ${items.length}`)
    return items
  }

  async getTransfers (dateFilter?: TransfersDateFilter): Promise<Transfer[]> {
    await this.tilReady()
    return this.getItems(dateFilter)
  }

  // gets only transfers within range: now - 1 week ago
  async getTransfersFromWeek () {
    await this.tilReady()
    const fromUnix = Math.floor((Date.now() - OneWeekMs) / 1000)
    return this.getTransfers({
      fromUnix
    })
  }

  async getUncommittedTransfers (
    filter: Partial<Transfer> = {}
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = await this.getTransfersFromWeek()
    return transfers.filter(item => {
      if (filter?.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      return (
        item.transferId &&
        !item.transferRootId &&
        item.transferSentTxHash &&
        !item.committed
      )
    })
  }

  async getUnbondedSentTransfers (
    filter: Partial<Transfer> = {}
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = await this.getTransfersFromWeek()
    return transfers.filter(item => {
      if (filter?.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      let timestampOk = true
      if (item.bondWithdrawalAttemptedAt) {
        if (TxError.BonderFeeTooLow === item.withdrawalBondTxError) {
          const delay = TxRetryDelayMs + ((1 << item.withdrawalBondBackoffIndex) * 60 * 1000)
          // TODO: use `sentTransferTimestamp` once it's added to db

          // don't attempt to bond withdrawals after a week
          if (delay > OneWeekMs) {
            return false
          }
          timestampOk = item.bondWithdrawalAttemptedAt + delay < Date.now()
        } else {
          timestampOk = item.bondWithdrawalAttemptedAt + TxRetryDelayMs < Date.now()
        }
      }

      return (
        item.transferId &&
        !item.withdrawalBonded &&
        item.transferSentTxHash &&
        item.isBondable &&
        !item.isTransferSpent &&
        timestampOk
      )
    })
  }

  async getBondedTransfersWithoutRoots (
    filter: Partial<Transfer> = {}
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = await this.getTransfersFromWeek()
    return transfers.filter(item => {
      if (filter?.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      return item.withdrawalBonded && !item.transferRootHash
    })
  }

  async getIncompleteItems (
    filter: Partial<Transfer> = {}
  ) {
    const transfers: Transfer[] = await this.getTransfers()
    return transfers.filter(item => {
      if (filter?.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      return (
        (item.transferSentBlockNumber && !item.transferSentTimestamp)
      )
    })
  }
}

export default TransfersDb
