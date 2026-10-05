import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios'

const URL_B64_TO_UINT8 = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/**
 * Registers the service worker and manages the push subscription for the
 * current user. Call `subscribe()` on login, `unsubscribe()` on logout.
 */
export function useWebPush() {
    const [supported, setSupported] = useState(false)
    const [permission, setPermission] = useState('default')
    const [subscription, setSubscription] = useState(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        const ok = 'serviceWorker' in navigator
            && 'PushManager' in window
            && 'Notification' in window

        setSupported(ok)

        if (ok) {
            setPermission(Notification.permission)
            navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
                if (reg) {
                    reg.pushManager.getSubscription().then(setSubscription)
                }
            })
        }
    }, [])

    /**
     * Ask for permission, create a subscription, POST it to the backend.
     * Returns 'granted', 'denied', or 'unsupported'.
     */
    const subscribe = useCallback(async () => {
        if (!supported) return 'unsupported'
        setBusy(true)
        try {
            const perm = await Notification.requestPermission()
            setPermission(perm)
            if (perm !== 'granted') return perm

            const reg = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready

            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
            if (!vapidPublicKey) {
                console.warn('[webpush] VITE_VAPID_PUBLIC_KEY is not set')
                return 'error'
            }

            let sub = await reg.pushManager.getSubscription()
            if (!sub) {
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: URL_B64_TO_UINT8(vapidPublicKey),
                })
            }
            setSubscription(sub)

            const raw = sub.toJSON()
            await api.post('/api/push/subscribe', {
                endpoint: raw.endpoint,
                keys: raw.keys,
            })

            return 'granted'
        } catch (err) {
            console.error('[webpush] subscribe failed', err)
            return 'error'
        } finally {
            setBusy(false)
        }
    }, [supported])

    const unsubscribe = useCallback(async () => {
        if (!supported) return
        setBusy(true)
        try {
            const reg = await navigator.serviceWorker.getRegistration('/sw.js')
            if (reg) {
                const sub = await reg.pushManager.getSubscription()
                if (sub) {
                    await api.delete('/api/push/unsubscribe', {
                        params: { endpoint: sub.endpoint },
                    }).catch(() => {})
                    await sub.unsubscribe()
                }
            }
            setSubscription(null)
        } catch (err) {
            console.error('[webpush] unsubscribe failed', err)
        } finally {
            setBusy(false)
        }
    }, [supported])

    /**
     * Send a test push to the current user.
     */
    const sendTest = useCallback(async () => {
        await api.post('/api/push/test')
    }, [])

    return {
        supported,
        permission,
        subscription,
        busy,
        subscribe,
        unsubscribe,
        sendTest,
    }
}