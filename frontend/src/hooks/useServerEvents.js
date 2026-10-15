import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { syncBus } from '../lib/syncBus'

const PUBLISH_DEBOUNCE_MS = 150
const RECONNECT_DELAY_MS = 5000   // wait 5s before retrying
const MAX_RECONNECT_ATTEMPTS = 10

export function useServerEvents() {
    const token = useAuthStore((s) => s.token)
    const esRef = useRef(null)
    const reconnectTimerRef = useRef(null)
    const reconnectCountRef = useRef(0)
    const debounceRef = useRef({ timer: null, lastAt: 0, pendingPayload: null })
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    useEffect(() => {
        // Clean up any existing connection before starting fresh
        const cleanup = () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            if (esRef.current) {
                esRef.current.close()
                esRef.current = null
            }
        }

        if (!token) {
            cleanup()
            return undefined
        }

        cleanup()
        reconnectCountRef.current = 0

        const openStream = () => {
            if (!mountedRef.current) return

            const currentToken = useAuthStore.getState().token
            if (!currentToken) {
                // Session lost — stop retrying
                return
            }

            const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
            const url = apiBase
                ? `${apiBase}/api/events/stream?token=${encodeURIComponent(currentToken)}`
                : `/api/events/stream?token=${encodeURIComponent(currentToken)}`

            let es
            try {
                es = new EventSource(url)
                esRef.current = es
            } catch (err) {
                console.warn('[sse] could not open stream', err)
                return
            }

            es.addEventListener('connected', () => {
                console.debug('[sse] connected')
                reconnectCountRef.current = 0
            })

            es.onmessage = (event) => {
                if (!event.data) return
                let msg
                try {
                    msg = JSON.parse(event.data)
                } catch {
                    return
                }
                const { topic, payload } = msg || {}
                if (!topic) return

                syncBus.publish(topic, payload)

                const now = Date.now()
                const state = debounceRef.current
                state.pendingPayload = {
                    source: 'sse',
                    serverTopic: topic,
                    payload,
                    at: now,
                }

                if (now - state.lastAt >= PUBLISH_DEBOUNCE_MS) {
                    state.lastAt = now
                    syncBus.publish('data-changed', state.pendingPayload)
                    state.pendingPayload = null
                } else if (!state.timer) {
                    const wait = PUBLISH_DEBOUNCE_MS - (now - state.lastAt)
                    state.timer = setTimeout(() => {
                        state.lastAt = Date.now()
                        if (state.pendingPayload) {
                            syncBus.publish('data-changed', state.pendingPayload)
                            state.pendingPayload = null
                        }
                        state.timer = null
                    }, wait)
                }
            }

            // Manual reconnect: close the dead ES and reopen with the
            // current token. The browser's default retry reuses the stale
            // URL (and stale token), so we override it.
            es.onerror = () => {
                if (esRef.current) {
                    esRef.current.close()
                    esRef.current = null
                }

                if (!mountedRef.current) return
                if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    console.warn('[sse] giving up after', MAX_RECONNECT_ATTEMPTS, 'attempts')
                    return
                }
                if (!useAuthStore.getState().token) return

                reconnectCountRef.current += 1
                reconnectTimerRef.current = setTimeout(openStream, RECONNECT_DELAY_MS)
            }
        }

        openStream()

        return () => {
            cleanup()
            if (debounceRef.current.timer) {
                clearTimeout(debounceRef.current.timer)
                debounceRef.current.timer = null
            }
        }
    }, [token])
}