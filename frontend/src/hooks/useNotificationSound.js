import { useCallback, useRef, useEffect } from 'react'
import {
    playNewTicketSound,
    playAttentionSound,
    playAlmostTurnSound,
    playServingSound,
    playCompletedSound,
    playNoShowSound,
    playCancelledSound,
    playTransferredSound,
    previewSound,
    initSoundUnlock,
} from '../lib/soundService'

const ALMOST_TURN_THRESHOLD = 3

/**
 * Staff-side sound triggers. Debounced so a burst of tickets doesn't
 * fire a "casino jackpot".
 */
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

/**
 * Student-side ticket watcher.
 *
 * Call `checkTicket(activeTicket)` whenever the ticket changes.
 * Fires the appropriate sound and returns an `event` object describing
 * what happened, so the caller can also show a toast:
 *
 *   { type, message, severity: 'info' | 'success' | 'error' }
 *
 * Returns null if nothing changed.
 */
export function useStudentTicketAlerts() {
    const lastStatusRef = useRef(null)
    const lastIdRef = useRef(null)
    const lastPositionRef = useRef(null)
    // Track which ticket keys we've already fired "almost turn" for,
    // so we don't repeat every poll. Key = `${id}-${joinedAt}` so a
    // rescheduled ticket (new joinedAt) can fire again.
    const almostTurnFiredRef = useRef(new Set())

    useEffect(() => {
        initSoundUnlock()
    }, [])

    const checkTicket = useCallback((ticket) => {
        // No active ticket — reset state
        if (!ticket) {
            lastStatusRef.current = null
            lastIdRef.current = null
            lastPositionRef.current = null
            return null
        }

        const isNewTicket = lastIdRef.current !== ticket.id
        const statusChanged = !isNewTicket && lastStatusRef.current !== ticket.status
        const position = typeof ticket.position === 'number' ? ticket.position : null
        const prevPosition = lastPositionRef.current
        const ticketKey = `${ticket.id}-${ticket.joinedAt || ''}`

        let event = null

        // ─── New ticket just appeared ───
        if (isNewTicket) {
            previewSound(0.35)
            event = {
                type: 'JOINED',
                message: `Ticket ${ticket.ticketNumber} · Position ${position ?? '—'}`,
                severity: 'info',
            }
        }
        // ─── Status transitioned ───
        else if (statusChanged) {
            switch (ticket.status) {
                case 'CALLED':
                    playAttentionSound()
                    setTimeout(() => playAttentionSound(), 1500)
                    setTimeout(() => playAttentionSound(), 3000)
                    event = {
                        type: 'CALLED',
                        message: `It's your turn! Ticket ${ticket.ticketNumber}`,
                        severity: 'success',
                    }
                    break

                case 'SERVING':
                    playServingSound()
                    event = {
                        type: 'SERVING',
                        message: `You're being served now`,
                        severity: 'success',
                    }
                    break

                case 'COMPLETED':
                    playCompletedSound()
                    event = {
                        type: 'COMPLETED',
                        message: `Service complete. Please rate your experience.`,
                        severity: 'success',
                    }
                    break

                case 'NO_SHOW':
                    playNoShowSound()
                    event = {
                        type: 'NO_SHOW',
                        message: `Your ticket was marked as no-show`,
                        severity: 'error',
                    }
                    break

                case 'CANCELLED':
                    playCancelledSound()
                    event = {
                        type: 'CANCELLED',
                        message: `Your ticket was cancelled`,
                        severity: 'info',
                    }
                    break

                case 'TRANSFERRED':
                    playTransferredSound()
                    event = {
                        type: 'TRANSFERRED',
                        message: `Your ticket was transferred to another desk`,
                        severity: 'info',
                    }
                    break

                case 'WAITLISTED':
                    previewSound(0.3)
                    event = {
                        type: 'WAITLISTED',
                        message: `You're on the waitlist for ${ticket.queueName || 'this queue'}`,
                        severity: 'info',
                    }
                    break

                case 'WAITING':
                    // Rejoin, reschedule, or promoted off waitlist
                    previewSound(0.35)
                    event = {
                        type: 'WAITING',
                        message: `You're back in the queue · Position ${position ?? '—'}`,
                        severity: 'info',
                    }
                    break

                default:
                    break
            }
        }
        // ─── Position crossed INTO the "almost your turn" zone ───
        else if (
            ticket.status === 'WAITING'
            && position !== null
            && prevPosition !== null
            && prevPosition > ALMOST_TURN_THRESHOLD
            && position <= ALMOST_TURN_THRESHOLD
            && !almostTurnFiredRef.current.has(ticketKey)
        ) {
            almostTurnFiredRef.current.add(ticketKey)
            playAlmostTurnSound()
            event = {
                type: 'ALMOST_TURN',
                message: position === 1
                    ? `You're next up!`
                    : `${position} ${position === 1 ? 'person' : 'people'} ahead of you`,
                severity: 'info',
            }
        }

        lastStatusRef.current = ticket.status
        lastIdRef.current = ticket.id
        lastPositionRef.current = position

        return event
    }, [])

    return { checkTicket }
}