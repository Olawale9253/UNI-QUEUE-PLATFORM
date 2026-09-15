import { create } from 'zustand'

const STORAGE_KEY = 'uniqueue_theme'

// System preference as fallback
function getSystemTheme() {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Load initial theme from localStorage or system
function loadInitialTheme() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'dark' || saved === 'light') return saved
    } catch {
        // ignore
    }
    return getSystemTheme()
}

// Apply theme to <html> element
function applyTheme(theme) {
    const root = document.documentElement
    if (theme === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
}

export const useThemeStore = create((set, get) => {
    const initial = loadInitialTheme()
    applyTheme(initial)

    return {
        theme: initial,

        setTheme: (theme) => {
            applyTheme(theme)
            try {
                localStorage.setItem(STORAGE_KEY, theme)
            } catch {
                // ignore
            }
            set({ theme })
        },

        toggle: () => {
            const next = get().theme === 'dark' ? 'light' : 'dark'
            get().setTheme(next)
            return next
        },
    }
})