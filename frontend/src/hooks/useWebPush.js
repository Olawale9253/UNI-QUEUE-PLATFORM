import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios'

const URL_B64_TO_UINT8 = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}

/**
 * Detect whether push notifications can work in this browser context.
 * Returns { supported, reason }.
 *
 * Reasons:
 *   'supported'          — everything's ready; subscribe() will work
 *   'ios-not-installed'  — iOS Safari, app not added to Home Screen (main iPhone blocker)
 *   'in-app-browser'     — Instagram/WhatsApp/Facebook/TikTok in-app browsers
 *   'insecure-context'   — HTTP (only localhost is exempt)
 *   'browser-unsupported'— old browsers with no push API
 */
function getPushSupportInfo() {
    if (typeof navigator === 'undefined') {
        return { supported: false, reason: 'browser-unsupported' }
    }

    const ua = navigator.userAgent || ''

    // iPadOS 13+ reports as "MacIntel" — must check maxTouchPoints too
    const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    const isStandalone =
        navigator.standalone === true ||
        (typeof window.matchMedia === 'function' &&
            window.matchMedia('(display-mode: standalone)').matches)

    const isInAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|TikTok|Line\//.test(ua)

    const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'

    const isSecure = window.isSecureContext || isLocalhost

    if (isInAppBrowser) return { supported: false, reason: 'in-app-browser' }
    if (isIOS && !isStandalone) return { supported: false, reason: 'ios-not-installed' }
    if (!isSecure) return { supported: false, reason: 'insecure-context' }

    if (
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
    ) {
        return { supported: false, reason: 'browser-unsupported' }
    }

    return { supported: true, reason: 'supported' }
}

export function useWebPush() {
    const [supported, setSupported] = useState(false)
    const [reason, setReason] = useState('checking')
    const [permission, setPermission] = useState('default')
    const [subscription, setSubscription] = useState(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        const info = getPushSupportInfo()
        setSupported(info.supported)
        setReason(info.reason)

        if (!info.supported) return

        setPermission(Notification.permission)
        navigator.serviceWorker
            .getRegistration('/sw.js')
            .then((reg) => {
                if (reg) {
                    reg.pushManager.getSubscription().then(setSubscription)
                }
            })
            .catch(() => {})
    }, [])

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
                    await api
                        .delete('/api/push/unsubscribe', {
                            params: { endpoint: sub.endpoint },
                        })
                        .catch(() => {})
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

    const sendTest = useCallback(async () => {
        await api.post('/api/push/test')
    }, [])

    return {
        supported,
        reason,
        permission,
        subscription,
        busy,
        subscribe,
        unsubscribe,
        sendTest,
    }
}