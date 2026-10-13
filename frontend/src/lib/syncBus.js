const CHANNEL_NAME = 'uniqueue-sync'

// Same-tab listeners (BroadcastChannel does NOT fire in the tab that posted)
const listeners = new Map()

let channel = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (entry) => {
        const { topic, payload } = entry.data || {}
        if (!topic) return
        dispatch(topic, payload)
    }
}

function dispatch(topic, payload) {
    const set = listeners.get(topic)
    if (!set) return
    set.forEach((fn) => {
        try { fn(payload) } catch (err) { console.error('[syncBus] handler failed', err) }
    })
}

export const syncBus = {
    /** Publish to every tab (including this one). */
    publish(topic, payload = {}) {
        dispatch(topic, payload)                                   // same tab
        if (channel) channel.postMessage({ topic, payload })       // other tabs
    },

    /** Subscribe to a topic. Returns an unsubscribe function. */
    subscribe(topic, handler) {
        if (!listeners.has(topic)) listeners.set(topic, new Set())
        listeners.get(topic).add(handler)
        return () => {
            const set = listeners.get(topic)
            if (set) set.delete(handler)
        }
    },
}
