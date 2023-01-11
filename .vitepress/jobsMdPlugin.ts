import MarkdownIt from 'markdown-it'

const excludedPages = ['src/sponsor/index.md', 'src/index.md']

export const jobsPlugin = (md: MarkdownIt) => {
  md.renderer.rules.heading_close = (tokens, i, options, env, self) => {
    const relativePath = env.relativePath
    const renderedContent = self.renderToken(tokens, i, options)

    return excludedPages.includes(relativePath)
      ? renderedContent
      : renderedContent.replace(/<\/h1>/, '</h1><xxx/>')
  }
}
