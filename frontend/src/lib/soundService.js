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

export function playNewTicketSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume
    playTone({ freq: 1318.5, duration: 0.12, volume: vol, type: 'sine' })
    setTimeout(() => {
        playTone({ freq: 1760, duration: 0.18, volume: vol, type: 'sine' })
    }, 110)
}

export function playAttentionSound() {
    const prefs = readPrefs()
    if (!prefs.notifySound) return
    const vol = prefs.soundVolume
    playTone({ freq: 1046.5, duration: 0.1, volume: vol, type: 'triangle' })
    setTimeout(() => playTone({ freq: 1046.5, duration: 0.1, volume: vol, type: 'triangle' }), 130)
    setTimeout(() => playTone({ freq: 1318.5, duration: 0.18, volume: vol, type: 'triangle' }), 260)
}

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
