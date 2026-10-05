import { useCallback, useRef, useEffect } from 'react'
import {
    playNewTicketSound,
    playAttentionSound,
    initSoundUnlock,
} from '../lib/soundService'

export function useNotificationSound() {
    const lastPlayRef = useRef(0)
    const DEBOUNCE_MS = 1200

    useEffect(() => {
        initSoundUnlock()
    }, [])

    const playNewTicket = useCallback(() => {
        const now = Date.now()
        if (now - lastPlayRef.current < DEBOUNCE_MS) return
        lastPlayRef.current = now
        playNewTicketSound()
    }, [])

    const playAttention = useCallback(() => {
        const now = Date.now()
        if (now - lastPlayRef.current < 400) return
        lastPlayRef.current = now
        playAttentionSound()
    }, [])

    return { playNewTicket, playAttention }
}
