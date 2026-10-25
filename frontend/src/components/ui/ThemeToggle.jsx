import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        // Check if dark mode is currently active
        setIsDark(document.documentElement.classList.contains('dark'))
    }, [])

    const toggleTheme = () => {
        const root = document.documentElement
        const nextTheme = isDark ? 'light' : 'dark'

        if (nextTheme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }

        // Save the manual choice so it overrides the system theme
        localStorage.setItem('theme', nextTheme)
        setIsDark(!isDark)
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex h-full w-full items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    )
}