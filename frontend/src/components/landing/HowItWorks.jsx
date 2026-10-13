import { motion } from 'framer-motion'
import {
    Building2,
    Ticket,
    Activity,
    Bell,
    CheckCircle2,
} from 'lucide-react'
import { stagger, staggerItem } from '../../lib/motion'

/**
 * "How it works" — 5-step flow shown on the landing page.
 * Uses the university's brand color automatically (via --color-brand-*)
 * so it themes itself per university.
 */

const STEPS = [
    {
        icon: Building2,
        title: 'Find a Service',
        description:
            'Browse every office and service at your university in one place.',
    },
    {
        icon: Ticket,
        title: 'Join the Queue',
        description:
            'Get a ticket number from anywhere — no more standing in line.',
    },
    {
        icon: Activity,
        title: 'Track Your Position',
        description:
            'Watch your place in line update live. No refreshing, no calling.',
    },
    {
        icon: Bell,
        title: 'Get Notified',
        description:
            "We ring a chime and push a notification when it's almost your turn.",
    },
    {
        icon: CheckCircle2,
        title: 'Show Up & Get Served',
        description:
            'Walk in exactly when it’s your turn. Walk out with what you came for.',
    },
]

export default function HowItWorks() {
    return (
        <section className="bg-slate-50 py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* ═══ Header ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
                        Simple Process
                    </div>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                        How UniQueue Works
                    </h2>
                    <p className="mt-4 text-base text-slate-600 sm:text-lg dark:text-slate-400">
                        Five simple steps from your phone to the front of the line.
                    </p>
                </motion.div>

                {/* ═══ Step cards ═══ */}
                <motion.div
                    variants={stagger(0.2, 0.08)}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, margin: '-80px' }}
                    className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5"
                >
                    {STEPS.map((step, index) => {
                        const Icon = step.icon
                        const isFirst = index === 0

                        return (
                            <motion.div
                                key={step.title}
                                variants={staggerItem}
                                className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                                    isFirst
                                        ? 'border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/30'
                                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                                }`}
                            >
                                {/* Step number — small badge top-right */}
                                <div
                                    className={`absolute right-5 top-5 text-[10px] font-bold uppercase tracking-widest ${
                                        isFirst
                                            ? 'text-brand-600 dark:text-brand-400'
                                            : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    Step {index + 1}
                                </div>

                                {/* Icon circle */}
                                <div
                                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${
                                        isFirst
                                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                            : 'bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {step.description}
                                </p>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}