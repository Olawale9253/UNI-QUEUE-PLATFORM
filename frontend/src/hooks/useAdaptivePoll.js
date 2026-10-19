import { useEffect, useRef } from 'react'

export function useAdaptivePoll(
    callback,
    { fastMs = 5000, slowMs = 30000, enabled = true } = {}
) {
    const callbackRef = useRef(callback)
    const timeoutRef = useRef(null)

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    useEffect(() => {
        if (!enabled) return

        let cancelled = false

        const tick = () => {
            if (cancelled) return
            const isVisible = document.visibilityState === 'visible'
            const delay = isVisible ? fastMs : slowMs

            timeoutRef.current = setTimeout(async () => {
                if (cancelled) return

                // ⬇️ NEW: If the browser is offline, skip the API call completely ⬇️
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    tick()
                    return
                }

                try {
                    await callbackRef.current()
                } catch {
                    // Silent — the callback should handle its own errors
                }
                tick()
            }, delay)
        }

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                Promise.resolve(callbackRef.current()).catch(() => {})
                tick()
            }
        }

        // Listen for network coming back online
        const onOnline = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            Promise.resolve(callbackRef.current()).catch(() => {})
            tick()
        }

        document.addEventListener('visibilitychange', onVisibilityChange)
        window.addEventListener('online', onOnline)

        tick()

        return () => {
            cancelled = true
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            document.removeEventListener('visibilitychange', onVisibilityChange)
            window.removeEventListener('online', onOnline)
        }
    }, [fastMs, slowMs, enabled])
}