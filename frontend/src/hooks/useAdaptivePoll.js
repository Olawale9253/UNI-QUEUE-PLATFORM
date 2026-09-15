import { useEffect, useRef } from 'react'

/**
 * Smart polling hook:
 *   - Runs `callback` on an interval
 *   - Polls fast (5s) when tab is visible
 *   - Polls slow (30s) when tab is hidden
 *   - Refetches immediately when tab becomes visible again
 *   - Cleans up on unmount
 *
 * Usage:
 *   useAdaptivePoll(fetchTickets, { fastMs: 5000, slowMs: 30000 })
 */
export function useAdaptivePoll(
    callback,
    { fastMs = 5000, slowMs = 30000, enabled = true } = {}
) {
    const callbackRef = useRef(callback)
    const timeoutRef = useRef(null)

    // Keep the latest callback in a ref so we don't restart the timer
    // when the caller passes a new function reference.
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
                // Fire immediately when the tab becomes visible again
                Promise.resolve(callbackRef.current()).catch(() => {})
                tick()
            }
        }

        document.addEventListener('visibilitychange', onVisibilityChange)

        // Start the loop
        tick()

        return () => {
            cancelled = true
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [fastMs, slowMs, enabled])
}