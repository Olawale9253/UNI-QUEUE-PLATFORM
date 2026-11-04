import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
    Building2,
    Ticket,
    Activity,
    Bell,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Sparkles,
    CheckCircle2,
    Radio,
    Shield,
    Coffee,
} from 'lucide-react'

const PROCESS_STEPS = [
    {
        id: 1,
        title: 'Discover & Select Service',
        category: 'Step 1 of 5',
        badge: 'Campus Service Directory',
        headline: 'Browse campus desks right from your phone.',
        description:
            'Explore every university office, bursary counter, library desk, and faculty center in one unified portal. Check real-time crowd sizes, active officers, and open hours before you even leave your hostel.',
        keyMetrics: [
            { label: 'Campus Offices', value: '30+ Desks' },
            { label: 'Status Updates', value: 'Real-Time' },
        ],
        icon: Building2,
        accentColor: 'from-blue-500 to-indigo-600',
        glowColor: 'rgba(99, 102, 241, 0.25)',
        demoComponent: Step1Visual,
    },
    {
        id: 2,
        title: 'Instant Digital Ticket',
        category: 'Step 2 of 5',
        badge: 'Zero-Queue Ticketing',
        headline: 'Grab your ticket in one tap from anywhere.',
        description:
            'No physical paper slips, no writing names on door sign-up sheets. Tap once to receive a cryptographically signed ticket with your unique number, active counter assignment, and initial wait estimate.',
        keyMetrics: [
            { label: 'Ticket Generation', value: 'Instant' },
            { label: 'Queue Security', value: 'Tamper-Proof' },
        ],
        icon: Ticket,
        accentColor: 'from-indigo-500 to-violet-600',
        glowColor: 'rgba(129, 140, 248, 0.25)',
        demoComponent: Step2Visual,
    },
    {
        id: 3,
        title: 'Live Tracking & Freedom',
        category: 'Step 3 of 5',
        badge: 'Server-Sent Events (SSE)',
        headline: 'Go about your day while your spot moves up.',
        description:
            'Relax in your room, study at the library, or attend lectures. Your queue position updates live in the background without refreshing, adapting automatically to real staff processing speeds.',
        keyMetrics: [
            { label: 'Sync Latency', value: '< 2 Seconds' },
            { label: 'Corridor Waiting', value: '0 Minutes' },
        ],
        icon: Activity,
        accentColor: 'from-cyan-500 to-blue-600',
        glowColor: 'rgba(6, 182, 212, 0.25)',
        demoComponent: Step3Visual,
    },
    {
        id: 4,
        title: 'Proactive Alert & Chime',
        category: 'Step 4 of 5',
        badge: 'Smart Proximity Notice',
        headline: 'Get alerted exactly when it is time to walk over.',
        description:
            'UniQueue protects your time. When you reach 3 positions away, your device rings an audible chime and delivers a high-priority push notification giving you ample time to stroll comfortably to the office.',
        keyMetrics: [
            { label: 'Alert Trigger', value: '3 Slots Away' },
            { label: 'Notification', value: 'Push & Audio' },
        ],
        icon: Bell,
        accentColor: 'from-amber-500 to-orange-600',
        glowColor: 'rgba(245, 158, 11, 0.25)',
        demoComponent: Step4Visual,
    },
    {
        id: 5,
        title: 'Direct Walk-In & Service',
        category: 'Step 5 of 5',
        badge: 'Frictionless Completion',
        headline: 'Step up to the counter and be served immediately.',
        description:
            'Walk straight to your designated window right as your number is called. The officer verifies your digital credentials with a click, completes your transaction in minutes, and logs your clearance.',
        keyMetrics: [
            { label: 'Counter Duration', value: '< 4 Minutes' },
            { label: 'Clearance Record', value: '100% Digital' },
        ],
        icon: BadgeCheck,
        accentColor: 'from-emerald-500 to-teal-600',
        glowColor: 'rgba(16, 185, 129, 0.25)',
        demoComponent: Step5Visual,
    },
]

// ═══════════════════════════════════════════════════════════
//  3D SCENE VISUALS FOR EACH STEP
// ═══════════════════════════════════════════════════════════

function Step1Visual() {
    return (
        <div className="relative flex h-full w-full flex-col justify-between p-6">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/20">
                    <Radio className="h-3 w-3 animate-pulse text-blue-400" /> Live Campus Radar
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Bursary & Student Accounts</span>
            </div>

            {/* 3D Department Cards Stack */}
            <div className="relative my-4 space-y-2.5">
                {[
                    { name: 'Bursary - Tuition & Fee Desk', active: true, queue: '4 Waiting', wait: '~8 min' },
                    { name: 'University Library - Clearance', active: false, queue: '1 Waiting', wait: '~2 min' },
                    { name: 'Faculty of Science - Dean Office', active: false, queue: '3 Waiting', wait: '~6 min' },
                ].map((item, idx) => (
                    <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{ transform: `translateZ(${idx === 0 ? 40 : 20}px)` }}
                        className={`flex items-center justify-between rounded-xl p-3 text-xs transition-all ${
                            item.active
                                ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span className={`h-2 w-2 rounded-full ${item.active ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                            <span className={item.active ? 'font-bold text-white' : 'font-medium'}>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-slate-300 font-semibold">{item.queue}</span>
                            <span className="rounded bg-black/30 px-2 py-0.5 font-mono text-brand-300">{item.wait}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-800/80 p-3 text-xs text-slate-300 border border-slate-700/60">
                <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-blue-400" /> Tap any desk to join instantly
                </span>
                <span className="text-blue-400 font-bold">1-Click Join &rarr;</span>
            </div>
        </div>
    )
}

function Step2Visual() {
    return (
        <div className="relative flex h-full w-full flex-col justify-between p-6">
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-400 border border-indigo-500/20">
                    Cryptographic Digital Ticket
                </span>
                <span className="font-mono text-xs text-emerald-400 font-bold">#B-042</span>
            </div>

            {/* 3D Holographic Ticket Mockup */}
            <motion.div
                style={{ transform: 'translateZ(50px)' }}
                className="my-auto rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/60 p-5 shadow-2xl relative overflow-hidden"
            >
                {/* Holographic shimmer */}
                <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-[shimmer_3s_infinite]" />

                <div className="flex items-start justify-between border-b border-indigo-500/20 pb-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">
                            University Bursary
                        </div>
                        <div className="text-sm font-black text-white mt-0.5">Counter 2 &bull; Tuition Audit</div>
                    </div>
                    <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                        CONFIRMED
                    </span>
                </div>

                <div className="my-4 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Your Ticket</div>
                        <div className="text-3xl font-black tracking-tight text-white font-mono drop-shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                            #B-042
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Estimated Wait</div>
                        <div className="text-2xl font-black text-indigo-300 font-mono">~8 MINS</div>
                    </div>
                </div>

                {/* Simulated digital barcode */}
                <div className="flex items-center justify-between pt-3 border-t border-indigo-500/20">
                    <div className="flex items-center gap-1">
                        {[4, 12, 6, 16, 8, 14, 4, 10, 16, 8, 6, 12, 14, 4, 8].map((h, i) => (
                            <div key={i} className="w-1 rounded-sm bg-indigo-400/60" style={{ height: h }} />
                        ))}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">SECURE TOKEN #9842</span>
                </div>
            </motion.div>

            <div className="text-center text-[11px] text-slate-400">
                Tamper-proof queue token &bull; Live sync connected
            </div>
        </div>
    )
}

function Step3Visual() {
    return (
        <div className="relative flex h-full w-full flex-col justify-between p-6">
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-400 border border-cyan-500/20">
                    Active Background Sync
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Coffee className="h-3.5 w-3.5 text-amber-400" /> Dorm / Cafeteria
                </span>
            </div>

            {/* Live Progress Ring & Queue Tickdown */}
            <div className="my-auto space-y-4" style={{ transform: 'translateZ(45px)' }}>
                <div className="flex items-center justify-center">
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-cyan-500/20 bg-slate-900/80 shadow-2xl">
                        {/* Circular animated pulse */}
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping opacity-25" />
                        <div className="text-center">
                            <div className="text-3xl font-black text-cyan-300 font-mono">2</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ahead of you</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-3 text-center">
                    <div className="text-xs font-semibold text-slate-300">
                        Currently serving: <span className="font-mono font-bold text-white">#B-040</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse" />
                    </div>
                    <div className="mt-2 text-[11px] text-cyan-400 font-mono font-semibold">
                        ~4 minutes remaining &bull; Walk when called
                    </div>
                </div>
            </div>

            <div className="text-center text-[11px] text-slate-400">
                Zero need to refresh &bull; Device updates in sleep mode
            </div>
        </div>
    )
}

function Step4Visual() {
    return (
        <div className="relative flex h-full w-full flex-col justify-between p-6">
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                    Proactive Proximity Alert
                </span>
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                    <Bell className="h-3.5 w-3.5 animate-bounce" /> Audio Chime
                </span>
            </div>

            {/* 3D Push Notification Pop-up */}
            <motion.div
                style={{ transform: 'translateZ(55px)' }}
                className="my-auto rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/40 p-5 shadow-2xl shadow-amber-500/10"
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30">
                        <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                                UniQueue Alert
                            </span>
                            <span className="text-[10px] text-slate-400">Just now</span>
                        </div>
                        <h4 className="mt-1 text-sm font-bold text-white">
                            You are 3rd in line! Time to head over.
                        </h4>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                            Ticket <span className="font-mono font-bold text-amber-300">#B-042</span>: Please make your way to <span className="font-semibold text-white">Bursary Counter 2</span>. Estimated 3 min walk.
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/20 text-xs">
                    <span className="font-medium text-amber-200">Audio Unlock Tone Active</span>
                    <span className="font-mono font-bold text-amber-400">&bull; Chime Played &bull;</span>
                </div>
            </motion.div>

            <div className="text-center text-[11px] text-slate-400">
                Arrive smoothly at the counter without rushing
            </div>
        </div>
    )
}

function Step5Visual() {
    return (
        <div className="relative flex h-full w-full flex-col justify-between p-6">
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                    Counter Service Complete
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </span>
            </div>

            {/* 3D Success Completion Badge */}
            <motion.div
                style={{ transform: 'translateZ(50px)' }}
                className="my-auto text-center space-y-4"
            >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/20">
                    <BadgeCheck className="h-10 w-10 text-white" />
                </div>

                <div>
                    <div className="text-lg font-black text-white">
                        Transaction Completed in 3m 42s
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                        Tuition clearance verified &bull; Digital stamp registered on campus ledger
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-mono font-bold text-emerald-300">
                    <span>CLEARANCE ID: #CL-2026-9042</span>
                    <span>✓</span>
                </div>
            </motion.div>

            <div className="text-center text-[11px] text-slate-400">
                Zero physical queue standing &bull; Proceed directly to next class
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════
//  MAIN 3D PROCESS ANIMATION WRAPPER
// ═══════════════════════════════════════════════════════════

export default function Process3DAnimation() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const cardRef = useRef(null)
    const reduceMotion = useReducedMotion()

    // 3D Tilt Motion Values
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { stiffness: 200, damping: 25 }
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig)
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-14, 14]), springConfig)
    const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']), springConfig)
    const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']), springConfig)

    const step = PROCESS_STEPS[currentStep]
    const VisualComponent = step.demoComponent

    // Mouse movement handler for 3D tilt
    const handleMouseMove = (e) => {
        if (!cardRef.current || reduceMotion) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        mouseX.set(x)
        mouseY.set(y)
    }

    const handleMouseLeave = () => {
        mouseX.set(0)
        mouseY.set(0)
    }

    // Auto-advance loop
    useEffect(() => {
        if (!isPlaying || reduceMotion) return
        const timer = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % PROCESS_STEPS.length)
        }, 5500)
        return () => clearInterval(timer)
    }, [isPlaying, reduceMotion])

    const handlePrev = () => {
        setCurrentStep((prev) => (prev - 1 + PROCESS_STEPS.length) % PROCESS_STEPS.length)
    }

    const handleNext = () => {
        setCurrentStep((prev) => (prev + 1) % PROCESS_STEPS.length)
    }

    return (
        <section id="how-it-works" className="relative overflow-hidden bg-slate-950 py-20 sm:py-28 text-white">
            {/* Ambient Background Glows */}
            <div
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full blur-[140px] opacity-20 transition-all duration-700"
                style={{ background: step.glowColor }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-300 backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                        Interactive 3D Process Simulator
                    </span>
                    <h2 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white lg:text-6xl">
                        How UniQueue Works
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Watch how UniQueue decouples waiting from physical locations—guiding students seamlessly from booking a ticket to instant counter service.
                    </p>
                </div>

                {/* Step Navigator Bar */}
                <div className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {PROCESS_STEPS.map((s, index) => {
                        const isActive = currentStep === index
                        const StepIcon = s.icon
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setCurrentStep(index)}
                                className={`group relative flex items-center gap-2 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-white text-slate-950 shadow-xl shadow-white/10 scale-105'
                                        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                                        isActive ? 'bg-slate-950 text-white' : 'bg-white/10 text-slate-300'
                                    }`}
                                >
                                    {s.id}
                                </span>
                                <span className="hidden sm:inline">{s.title}</span>
                                <StepIcon className="h-4 w-4 sm:hidden" />

                                {isActive && isPlaying && !reduceMotion && (
                                    <motion.div
                                        key={`step-progress-${currentStep}`}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 5.5, ease: 'linear' }}
                                        className="absolute -bottom-1 left-2 right-2 h-1 origin-left rounded-full bg-brand-500"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* 3D Visual Stage and Description Grid */}
                <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">

                    {/* Left Column: Clean & Rich Description */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-brand-500/20 px-3 py-1 text-xs font-bold text-brand-300 border border-brand-500/30">
                            {step.category} &bull; {step.badge}
                        </div>

                        <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            {step.headline}
                        </h3>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            {step.description}
                        </p>

                        {/* Step Key Metrics */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {step.keyMetrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                                >
                                    <div className="text-lg sm:text-xl font-black text-white font-mono">
                                        {metric.value}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                                        {metric.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Playback Navigation */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handlePrev}
                                aria-label="Previous step"
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsPlaying(!isPlaying)}
                                aria-label={isPlaying ? 'Pause auto-play' : 'Resume auto-play'}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/15 hover:scale-105"
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="h-4 w-4" /> Pause Auto-play
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" /> Resume Auto-play
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleNext}
                                aria-label="Next step"
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Interactive 3D Perspective Card Stage */}
                    <div className="lg:col-span-7 flex justify-center [perspective:1400px]">
                        <motion.div
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                rotateX: reduceMotion ? 0 : rotateX,
                                rotateY: reduceMotion ? 0 : rotateY,
                                transformStyle: 'preserve-3d',
                            }}
                            className="relative h-[440px] sm:h-[480px] w-full max-w-xl rounded-3xl border border-white/15 bg-slate-900/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden cursor-grab active:cursor-grabbing"
                        >
                            {/* Dynamic 3D Glare Lighting Reflection */}
                            <motion.div
                                style={{
                                    left: glareX,
                                    top: glareY,
                                    transform: 'translate(-50%, -50%)',
                                }}
                                className="pointer-events-none absolute h-96 w-96 rounded-full bg-gradient-to-r from-white/10 to-transparent blur-2xl"
                            />

                            {/* Top Stage Bar */}
                            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                    <span className="ml-2 font-mono text-[11px] text-slate-400">
                                        uniqueue-3d-engine://step/{step.id}
                                    </span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                    Interactive 3D Stage
                                </span>
                            </div>

                            {/* Animated Visual Stage */}
                            <div className="relative h-[calc(100%-57px)] w-full overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, scale: 0.94, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.94, y: -15 }}
                                        transition={{ duration: 0.35, ease: 'easeOut' }}
                                        className="h-full w-full"
                                    >
                                        <VisualComponent />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Bottom 3D depth cue note */}
                            <div className="pointer-events-none absolute bottom-3 right-4 text-[10px] font-mono text-slate-500 hidden sm:block">
                                Hover &amp; move cursor to tilt 3D perspective
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    )
}
