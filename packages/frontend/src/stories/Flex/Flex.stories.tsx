import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import Flex from 'src/components/ui/Flex'

export default {
  title: 'Example/Flex',
  component: Flex,
} as ComponentMeta<typeof Flex>

const Template: ComponentStory<typeof Flex> = args => (
  <Flex border={1} p={5} fontSize={3} {...args}>
    Flex
  </Flex>
)

export const Basic = Template.bind({})
Basic.args = {
  justifyCenter: true,
  alignCenter: true,
}
