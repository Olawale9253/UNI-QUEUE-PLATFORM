import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { syncBus } from '../lib/syncBus'

const PUBLISH_DEBOUNCE_MS = 150

export function useServerEvents() {
    const token = useAuthStore((item) => item.token)
    const esRef = useRef(null)
    const debounceRef = useRef({ timer: null, lastAt: 0, pendingPayload: null })

    useEffect(() => {
        if (!token) {
            if (esRef.current) {
                esRef.current.close()
                esRef.current = null
            }
            return undefined
        }

        if (esRef.current) return undefined

        const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
        const url = apiBase
            ? `${apiBase}/api/events/stream?token=${encodeURIComponent(token)}`
            : `/api/events/stream?token=${encodeURIComponent(token)}`

        let es
        try {
            es = new EventSource(url)
            esRef.current = es
        } catch (err) {
            console.warn('[sse] could not open stream', err)
            return undefined
        }

        es.addEventListener('connected', () => {
            console.debug('[sse] connected')
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

        es.onerror = () => {
            console.debug('[sse] connection error — browser will retry')
        }

        return () => {
            if (esRef.current) {
                esRef.current.close()
                esRef.current = null
            }
            if (debounceRef.current.timer) {
                clearTimeout(debounceRef.current.timer)
                debounceRef.current.timer = null
            }
        }
    }, [token])
}