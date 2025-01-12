import Logger from 'src/logger'
import level from 'level'
import mkdirp from 'mkdirp'
import os from 'os'
import path from 'path'
import sub from 'subleveldown'
import { Mutex } from 'async-mutex'
import { TenSecondsMs } from 'src/constants'
import { config as globalConfig } from 'src/config'

const dbMap: { [key: string]: any } = {}

export type BaseItem = {
  _id?: string
  _createdAt?: number
}

// this are options that leveldb createReadStream accepts
export type KeyFilter = {
  gt?: string
  gte?: string
  lt?: string
  lte?: string
  limit?: number
  reverse?: boolean
  keys?: boolean
  values?: boolean
}

class BaseDb {
  public db: any
  public prefix: string
  logger: Logger
  mutex: Mutex = new Mutex()

  constructor (prefix: string, _namespace?: string) {
    if (!prefix) {
      throw new Error('db prefix is required')
    }
    if (_namespace) {
      prefix = `${_namespace}:${prefix}`
    }
    this.prefix = prefix
    this.logger = new Logger({
      tag: 'Db',
      prefix
    })
    const pathname = path.resolve(globalConfig.db.path.replace('~', os.homedir()))
    mkdirp.sync(pathname.replace(path.basename(pathname), ''))
    if (!dbMap[pathname]) {
      this.logger.info(`db path: ${pathname}`)
      dbMap[pathname] = level(pathname)
    }

    const key = `${pathname}:${prefix}`
    if (!dbMap[key]) {
      dbMap[key] = sub(dbMap[pathname], prefix, { valueEncoding: 'json' })
    }
    this.db = dbMap[key]

    const logPut = (key: string, value: any) => {
      // only log recently created items
      const recentlyCreated = value?._createdAt && Date.now() - value._createdAt < TenSecondsMs
      if (recentlyCreated) {
        this.logger.debug(`put item, key=${key}`)
      }
    }

    this.db
      .on('open', () => {
        this.logger.debug('open')
      })
      .on('closed', () => {
        this.logger.debug('closed')
      })
      .on('batch', (ops: any[]) => {
        for (const op of ops) {
          if (op.type === 'put') {
            logPut(op.key, op.value)
          }
        }
      })
      .on('put', (key: string, value: any) => {
        logPut(key, value)
      })
      .on('clear', (key: string) => {
        this.logger.debug(`clear item, key=${key}`)
      })
      .on('error', (err: Error) => {
        this.logger.error(`leveldb error: ${err.message}`)
      })
  }

  protected async _getUpdateData (key: string, data: any) {
    const entry = await this.getById(key, {
      _createdAt: Date.now()
    })
    const value = Object.assign({}, entry, data)
    return { key, value }
  }

  async _update (key: string, data: any) {
    return this.mutex.runExclusive(async () => {
      const { value } = await this._getUpdateData(key, data)
      return this.db.put(key, value)
    })
  }

  public async batchUpdate (updates: any[]) {
    return this.mutex.runExclusive(async () => {
      const ops : any[] = []
      for (const data of updates) {
        const { key, value } = await this._getUpdateData(data.key, data.value)
        ops.push({
          type: 'put',
          key,
          value
        })
      }

      return new Promise((resolve, reject) => {
        this.db.batch(ops, (err: Error) => {
          if (err) {
            reject(err)
            return
          }

          resolve(null)
        })
      })
    })
  }

  async getById (id: string, defaultValue: any = null) {
    try {
      const value = await this.db.get(id)
      return this.normalizeReadValue(id, value)
    } catch (err) {
      if (!err.message.includes('Key not found in database')) {
        this.logger.error(`getById error: ${err.message}`)
      }
      return defaultValue
    }
  }

  attachId (id: string, item: any) {
    if (item) {
      item._id = id
    }
    return item
  }

  normalizeReadValue (key: string, value: any) {
    return this.attachId(key, value)
  }

  async batchGetByIds (ids: string[], defaultValue: any = null) {
    const values = await this.db.getMany(ids)
    const items: any[] = values.map((item: any, i: number) => {
      return this.normalizeReadValue(ids[i], item)
    })

    return items.filter(x => x)
  }

  protected async deleteById (id: string) {
    return this.db.del(id)
  }

  async getKeys (filter?: KeyFilter): Promise<string[]> {
    filter = Object.assign({
      keys: true,
      values: false
    }, filter)
    const kv = await this.getKeyValues(filter)
    return kv.map(x => x.key).filter(x => x)
  }

  async getValues (filter?: KeyFilter): Promise<any[]> {
    filter = Object.assign({
      keys: true,
      values: true
    }, filter)
    const kv = await this.getKeyValues(filter)
    return kv.map(x => x.value).filter(x => x)
  }

  async getKeyValues (filter: KeyFilter = { keys: true, values: true }): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const kv : any[] = []
      this.db.createReadStream(filter)
        .on('data', (key: any, value: any) => {
          // the parameter types depend on what key/value enabled options were used
          if (typeof key === 'object') {
            value = key.value
            key = key.key
          }
          // ignore this key that used previously to track unique ids
          if (key === 'ids') {
            return
          }
          if (typeof key === 'string') {
            value = this.normalizeReadValue(key, value)
            kv.push({ key, value })
          }
        })
        .on('end', () => {
          resolve(kv)
        })
        .on('error', (err: any) => {
          reject(err)
        })
    })
  }
}

export default BaseDb
