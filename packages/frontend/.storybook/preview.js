import React from 'react'
import ThemeProvider from 'src/theme/ThemeProvider'
import Web3Context from 'src/contexts/Web3Context'
import AppContext from 'src/contexts/AppContext'
import { MemoryRouter } from 'react-router'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  Story => (
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <Web3Context>
          <AppContext>
            <Story />
          </AppContext>
        </Web3Context>
      </ThemeProvider>
    </MemoryRouter>
  ),
]
