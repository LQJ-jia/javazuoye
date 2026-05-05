import { h } from 'vue'
import Theme from 'vitepress/theme'
import NoteManager from './components/NoteManager.vue'
import './style.css'

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout)
  },
  enhanceApp({ app }) {
    app.component('NoteManager', NoteManager)
  }
}
