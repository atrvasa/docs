// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import Newsletter from './components/Newsletter.vue'
// @ts-ignore: CSS module side-effect import
import './custom.css' 

export default {
  extends: DefaultTheme,

  /**
   * Enhances the Vue application instance.
   * We register the Newsletter component globally so it can be 
   * used directly inside any .md file as <Newsletter />.
   */
  enhanceApp({ app }: { app: import('vue').App }) {
    app.component('news-letter', Newsletter)
  }
}