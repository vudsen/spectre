import React from 'react'
import type { Tour } from 'shepherd.js'

export type ToolchainItemsContextType = {
  tour?: Tour
}

export const ToolchainItemsContext =
  React.createContext<ToolchainItemsContextType>({})
