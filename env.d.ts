/// <reference types="vitepress/client" />
/// <reference types="vue/macros-global" />

declare module '@atrvasa/theme/config' {
  import { UserConfig } from 'vitepress'
  const config: () => Promise<UserConfig>
  export default config
}

declare module '@atrvasa/theme/highlight' {
  const createHighlighter: () => Promise<(input: string) => string>
  export default createHighlighter
}
