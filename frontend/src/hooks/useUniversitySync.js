import { useEffect } from 'react'
import { useUniversityStore } from '../store/universityStore'

export function useUniversitySync() {
    useEffect(() => {
        const refresh = () => {
            if (localStorage.getItem('uniqueue_token')) {
                useUniversityStore.getState().load()
            }
        }

        const onVisibility = () => {
            if (document.visibilityState === 'visible') refresh()
        }
        const onFocus = () => refresh()

        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('focus', onFocus)

        const state = useUniversityStore.getState()
        if (localStorage.getItem('uniqueue_token') && !state.university) {
            refresh()
        }

        return () => {
            document.removeEventListener('visibilitychange', onVisibility)
            window.removeEventListener('focus', onFocus)
        }
    }, [])
}