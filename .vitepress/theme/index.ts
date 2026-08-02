// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
// @ts-ignore: CSS module side-effect import
import './custom.css' 

export default {
  extends: DefaultTheme
}