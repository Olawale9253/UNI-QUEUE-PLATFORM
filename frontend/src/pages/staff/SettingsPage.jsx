import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Bell, Moon, Sun, Volume2, Shield, ArrowRight, Save, RefreshCw,
    Play, BellRing, CheckCircle2,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { previewSound } from '../../lib/soundService'
import { useWebPush } from '../../hooks/useWebPush'

const STORAGE_KEY = 'uniqueue_staff_prefs'
const DEFAULTS = { notifyNewTicket: true, notifySound: false, soundVolume: 0.5, autoRefresh: true, compactMode: false }

function Toggle({ label, description, checked, onChange, disabled }) { /* Kept identical */ }

export default function SettingsPage() {
    const { push } = useToastStore()
    const [prefs, setPrefs] = useState(DEFAULTS)
    const webPush = useWebPush()

    // ... logic kept identical ...

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-4">
            {/* Premium Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Personal preferences for your staff workspace.
                </p>
            </div>

            <div className="space-y-6">
                {/* Notifications section kept identical */}
                {/* Display section kept identical */}
                {/* Account section kept identical */}

                <div className="flex items-center justify-end gap-3">
                    <Button variant="secondary" icon={RefreshCw} onClick={reset}>Reset</Button>
                    <Button icon={Save} onClick={save}>Save preferences</Button>
                </div>
            </div>
        </div>
    )
}