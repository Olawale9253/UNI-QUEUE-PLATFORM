import { motion, AnimatePresence } from 'framer-motion'
import {
    User, CheckCircle2, ListOrdered, Clock, Info, Building2,
    RefreshCw, XCircle, AlertCircle, Ticket, Lock, Users,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import CopyButton from '../../components/ui/CopyButton'
import { SkeletonRow, SkeletonBox } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { stagger, staggerItem } from '../../lib/motion'
import { useNotificationSound } from '../../hooks/useNotificationSound'
import { useBrowserNotifications } from '../../hooks/useBrowserNotifications'
import { syncBus } from '../../lib/syncBus'
import { useEffect, useState, useCallback, useRef } from 'react'

const STATUS_VARIANTS = {
    WAITING: 'warning',
    WAITLISTED: 'info',
    CALLED: 'indigo',
    SERVING: 'indigo',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
    CANCELLED: 'default',
    TRANSFERRED: 'default',
}

const STATUS_LABELS = {
    WAITING: 'Waiting',
    WAITLISTED: 'Waitlisted',
    CALLED: 'Called',
    SERVING: 'Serving',
    COMPLETED: 'Completed',
    NO_SHOW: 'No-show',
    CANCELLED: 'Cancelled',
    TRANSFERRED: 'Transferred',
}

function formatTime(dt) {
    if (!dt) return null
    try {
        return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
        return null
    }
}

function ServingQueueSkeleton() { /* Kept identical */ }

function describeEmptyQueue(queue, tickets) { /* Kept identical */ }

export default function ServingQueue() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [activeQueueId, setActiveQueueId] = useState(null)
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [ticketsLoading, setTicketsLoading] = useState(false)
    const [acting, setActing] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const { playNewTicket, playAttention } = useNotificationSound()
    const browserNotif = useBrowserNotifications()
    const prevTicketIdsRef = useRef(null)

    const actingRef = useRef(false)
    const actionVersionRef = useRef(0)
    const suppressPollUntilRef = useRef(0)
    const lastLocalActionAtRef = useRef(0)

    const activeQueue = queues.find((queue) => queue.id === activeQueueId) || null
    const isClosed = activeQueue?.isOpen === false

    // ... all load functions and useEffect hooks kept identical ...

    if (loading) return <ServingQueueSkeleton />

    return (
        <div className="space-y-6 pb-12">
            {/* Premium Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Queue Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage active queues for your office.
                    </p>
                </div>
            </div>

            {isClosed && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                    {/* ... warning content ... */}
                </div>
            )}

            <Card className="mb-6">
                {/* ... Queue selection & Call Next logic ... */}
            </Card>

            <Card className="mb-6">
                {/* ... Current Serving ... */}
            </Card>

            <Card padded={false}>
                {/* ... Waiting Tickets list ... */}
            </Card>
        </div>
    )
}