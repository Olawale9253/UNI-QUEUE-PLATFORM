const STORAGE_KEY = 'uniqueue_staff_prefs'

function readPrefs() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { notifySound: false, soundVolume: 0.5 }
        const p = JSON.parse(raw)
        return {
            notifySound: !!p.notifySound,
            soundVolume: typeof p.soundVolume === 'number' ? p.soundVolume : 0.5,
        }
    } catch {
        return { notifySound: false, soundVolume: 0.5 }
    }
}

let ctx = null
let unlocked = false
let unlockListenerAttached = false

function getCtx() {
    if (ctx) return ctx
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    return ctx
}

function attachUnlockListener() {
    if (unlockListenerAttached) return
    unlockListenerAttached = true

    const unlock = () => {
        const c = getCtx()
        if (c && c.state === 'suspended') {
            c.resume().then(() => { unlocked = true }).catch(() => {})
        } else if (c) {
            unlocked = true
        }
    }

    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    document.addEventListener('keydown', unlock)
}

function playTone({ freq = 880, duration = 0.15, volume = 0.5, type = 'sine' } = {}) {
    const c = getCtx()
    if (!c) return false

    if (c.state === 'suspended') {
        c.resume().catch(() => {})
    }

    const osc = c.createOscillator()
    const gain = c.createGain()

    osc.type = type
    osc.frequency.value = freq

    const now = c.currentTime
    const peak = Math.max(0.0001, Math.min(1, volume))
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(now)
    osc.stop(now + duration + 0.02)

    return true
}

// ─── Staff sounds ───

export function playNewTicketSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume
    playTone({ freq: 1318.5, duration: 0.12, volume: vol, type: 'sine' })
    setTimeout(() => playTone({ freq: 1760, duration: 0.18, volume: vol, type: 'sine' }), 110)
}

export function playAttentionSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume
    playTone({ freq: 1046.5, duration: 0.1, volume: vol, type: 'triangle' })
    setTimeout(() => playTone({ freq: 1046.5, duration: 0.1, volume: vol, type: 'triangle' }), 130)
    setTimeout(() => playTone({ freq: 1318.5, duration: 0.18, volume: vol, type: 'triangle' }), 260)
}

// ─── Student ticket lifecycle sounds ───

/** Almost your turn — soft, non-intrusive warning */
export function playAlmostTurnSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume * 0.8
    playTone({ freq: 659.25, duration: 0.1, volume: vol, type: 'sine' })   // E5
    setTimeout(() => playTone({ freq: 783.99, duration: 0.14, volume: vol, type: 'sine' }), 140)  // G5
}

/** Being served — friendly, reassuring */
export function playServingSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume
    playTone({ freq: 523.25, duration: 0.12, volume: vol, type: 'sine' })  // C5
    setTimeout(() => playTone({ freq: 659.25, duration: 0.18, volume: vol, type: 'sine' }), 130)  // E5
}

/** Service completed — satisfying resolve */
export function playCompletedSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume
    playTone({ freq: 783.99, duration: 0.12, volume: vol, type: 'sine' })  // G5
    setTimeout(() => playTone({ freq: 1046.5, duration: 0.2, volume: vol, type: 'sine' }), 140)  // C6
}

/** No-show — low descending warning */
export function playNoShowSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume
    playTone({ freq: 440, duration: 0.2, volume: vol, type: 'triangle' })       // A4
    setTimeout(() => playTone({ freq: 349.23, duration: 0.28, volume: vol, type: 'triangle' }), 200)  // F4
}

/** Cancelled — neutral descending */
export function playCancelledSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume * 0.9
    playTone({ freq: 659.25, duration: 0.15, volume: vol, type: 'sine' })    // E5
    setTimeout(() => playTone({ freq: 523.25, duration: 0.25, volume: vol, type: 'sine' }), 150)  // C5
}

/** Transferred — single soft note */
export function playTransferredSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    playTone({ freq: 587.33, duration: 0.16, volume: prefs.soundVolume, type: 'sine' })  // D5
}

// ─── Utility ───

export function previewSound(volume = 0.5) {
    const c = getCtx()
    if (c && c.state === 'suspended') {
        c.resume().catch(() => {})
    }
    playTone({ freq: 1318.5, duration: 0.12, volume, type: 'sine' })
    setTimeout(() => playTone({ freq: 1760, duration: 0.18, volume, type: 'sine' }), 110)
}

export function initSoundUnlock() {
    attachUnlockListener()
}