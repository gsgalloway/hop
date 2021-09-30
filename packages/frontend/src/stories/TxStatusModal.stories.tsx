import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import TxStatusModal from 'src/components/txStatus/TxStatusModal'
import Transaction from 'src/models/Transaction'

export default {
  title: 'components/TxStatusModal',
  component: TxStatusModal,
} as ComponentMeta<typeof TxStatusModal>

export const simple: ComponentStory<typeof TxStatusModal> = () => {
  function handleClose() {
    console.log('close')
  }

  const tx = {
    networkName: 'ethereum',
    token: {
      symbol: '',
    },
  }

  return <TxStatusModal onClose={handleClose} tx={tx as Transaction} />
}
