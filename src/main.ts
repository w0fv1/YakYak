import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const bundleUrl = new URL(import.meta.url)
    const serviceWorkerUrl = new URL('../sw.js', bundleUrl)

    navigator.serviceWorker.register(serviceWorkerUrl, {
      type: 'classic',
    })
  })
}

export default app
