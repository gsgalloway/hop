import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Box } from '@material-ui/core'

export default {
  title: 'ui/Box',
  component: Box,
} as ComponentMeta<typeof Box>

export const box: ComponentStory<typeof Box> = () => (
  <div>
    <Box>Box</Box>
    <Box border={1}>Box border=1</Box>
  </div>
)
