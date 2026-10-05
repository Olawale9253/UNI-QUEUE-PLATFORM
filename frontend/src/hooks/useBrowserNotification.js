import { useCallback, useEffect, useState } from 'react'

export function useBrowserNotifications() {
    const [permission, setPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    )

    useEffect(() => {
        if (typeof Notification === 'undefined') return
        setPermission(Notification.permission)
    }, [])

    const request = useCallback(async () => {
        if (typeof Notification === 'undefined') return 'unsupported'
        const result = await Notification.requestPermission()
        setPermission(result)
        return result
    }, [])

    const notify = useCallback((title, body, options = {}) => {
        if (typeof Notification === 'undefined') return null
        if (Notification.permission !== 'granted') return null
        if (document.visibilityState === 'visible' && !options.force) return null

        try {
            const n = new Notification(title, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: options.tag || 'uniqueue',
                renotify: !!options.tag,
                requireInteraction: false,
                silent: false,
                ...options,
            })

            n.onclick = () => {
                window.focus()
                n.close()
                if (options.onClick) options.onClick()
            }

            setTimeout(() => n.close(), 8000)
            return n
        } catch (err) {
            console.warn('Notification failed:', err)
            return null
        }
    }, [])

    return {
        permission,
        request,
        notify,
        isSupported: typeof Notification !== 'undefined',
    }
}