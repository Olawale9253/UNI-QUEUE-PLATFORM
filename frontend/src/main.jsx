import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'

// Apply theme BEFORE first paint to prevent flash of wrong theme
    ;(function initTheme() {
    try {
        const saved = localStorage.getItem('uniqueue_theme')
        if (saved === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (saved === 'light') {
            document.documentElement.classList.remove('dark')
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark')
        }
    } catch {
        // ignore
    }
})()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
)