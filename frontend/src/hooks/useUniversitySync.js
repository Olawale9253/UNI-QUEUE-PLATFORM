cat > src/hooks/useUniversitySync.js << 'EOF'
import { useEffect } from 'react'
import { useUniversityStore } from '../store/universityStore'

/**
 * Refetches the current user's university whenever the tab regains focus,
 * so brand color / logo / name updates made by a Super Admin show up
 * without the user needing to log out and back in.
 */
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

        // Initial load if we have a token but no cached university
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
EOF