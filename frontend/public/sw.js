/* UniQueue Service Worker — handles Web Push */

self.addEventListener('install', (event) => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log('[sw] push event with no data')
        return
    }

    let payload
    try {
        payload = event.data.json()
    } catch (e) {
        payload = { title: 'UniQueue', body: event.data.text() }
    }

    const title = payload.title || 'UniQueue'
    const options = {
        body: payload.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: (payload.data && payload.data.type) || 'uniqueue',
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: payload.data || {},
        timestamp: payload.timestamp || Date.now(),
    }

    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const targetUrl = (event.notification.data && event.notification.data.url) || '/'

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(targetUrl)
                        return client.focus()
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl)
                }
            })
    )
})