import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
    Bell,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Search,
} from 'lucide-react'

const PROCESS_STEPS = [
    {
        id: 1,
        title: 'Choose an Office',
        stepNumber: 'Step 1 of 5',
        subtitle: 'Live Campus Directory',
        heading: 'Browse every campus desk before leaving your room',
        description:
            'Open UniQueue on your phone or laptop to view all active university counters. See current wait times, how many students are in line, and active desk hours in real time.',
        benefits: [
            'Instant overview of all open university counters',
            'Know current wait times before you start walking',
        ],
        detail: 'Students check desk status from their hostel or lecture hall instead of walking to a closed office.',
    },
    {
        id: 2,
        title: 'Get Your Digital Ticket',
        stepNumber: 'Step 2 of 5',
        subtitle: 'Remote Ticket Generation',
        heading: 'Take a ticket in one tap with zero physical lines',
        description:
            'Tap once to take your place in line. You receive a digital ticket with your assigned window, current position, and a calculated wait estimate based on real staff speeds.',
        benefits: [
            'No paper sign up sheets or crowded doorways',
            'Fair, transparent order tracked by the university system',
        ],
        detail: 'Your ticket is saved to your phone. There is no need to stand outside or guard a physical spot.',
    },
    {
        id: 3,
        title: 'Wait Wherever You Choose',
        stepNumber: 'Step 3 of 5',
        subtitle: 'Background Position Updates',
        heading: 'Study, eat, or rest while your place moves up',
        description:
            'Your phone tracks your position automatically in the background. The queue countdown adjusts live as desk officers attend to students, giving you total freedom during your day.',
        benefits: [
            'Zero minutes wasted standing in crowded hallways',
            'Attend classes or study in the library without losing your spot',
        ],
        detail: 'Students report saving up to two hours per visit by simply waiting in comfortable campus spaces.',
    },
    {
        id: 4,
        title: 'Timely Arrival Notice',
        stepNumber: 'Step 4 of 5',
        subtitle: 'Smart Arrival Alert',
        heading: 'Get alerted with enough time to walk over',
        description:
            'When you are two positions away from the counter, UniQueue rings an audio chime and sends a clear notification to your phone so you can stroll comfortably to the office.',
        benefits: [
            'Walk to the office only when your turn is close',
            'Distinct chime sound ensures you never miss your call',
        ],
        detail: 'Desk staff experience quiet, organized counters instead of noisy, agitated crowds in the corridors.',
    },
    {
        id: 5,
        title: 'Quick Counter Service',
        stepNumber: 'Step 5 of 5',
        subtitle: 'Direct Walk In and Completion',
        heading: 'Step straight to the window and finish in minutes',
        description:
            'Arrive at your assigned window just as your number is called. The officer confirms your student record digitally, completes your request quickly, and logs your clearance.',
        benefits: [
            'Average desk transaction finished in under four minutes',
            'Clearance records update immediately across university databases',
        ],
        detail: 'Students leave with full digital confirmation, while administrators retain accurate service logs.',
    },
]

// ═══════════════════════════════════════════════════════════
//  PHONE SCREEN VISUALS FOR EACH STEP
// ═══════════════════════════════════════════════════════════

function ScreenStep1() {
    return (
        <div className="flex h-full flex-col justify-between p-4 text-slate-800 dark:text-slate-100">
            <div>
                {/* Search Header */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                    <span>Search university offices...</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Available Desks</span>
                    <span className="text-emerald-600 dark:text-emerald-400">3 Open Counters</span>
                </div>

                {/* Office List */}
                <div className="mt-2.5 space-y-2">
                    <div className="rounded-xl border-2 border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 p-2.5 transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-950 dark:text-brand-100">Student Accounts & Bursary</span>
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Open</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                            <span>Window 2: Tuition Clearance</span>
                            <span className="font-semibold text-brand-700 dark:text-brand-300">4 students in line</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 opacity-80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">University Library Desk</span>
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Open</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Book Return & Clearance</span>
                            <span>1 student in line</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 opacity-80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Faculty Registry Office</span>
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Open</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Document Endorsement</span>
                            <span>3 students in line</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-brand-600 py-2.5 text-center text-xs font-bold text-white shadow-md">
                Select Bursary Counter
            </div>
        </div>
    )
}

function ScreenStep2() {
    return (
        <div className="flex h-full flex-col justify-between p-4 text-slate-800 dark:text-slate-100">
            <div>
                <div className="text-center">
                    <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        Ticket Confirmed
                    </span>
                    <h4 className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        Student Accounts and Bursary
                    </h4>
                </div>

                {/* Clean Digital Ticket Card */}
                <div className="mt-4 rounded-2xl border border-brand-200 dark:border-brand-800 bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 shadow-sm text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Your Ticket Number
                    </div>
                    <div className="my-1 text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                        Ticket B42
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Window 2: Tuition Clearance
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 text-left">
                        <div>
                            <div className="text-[10px] text-slate-400">Position in line</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">4th student</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400">Estimated wait</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">8 minutes</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                Saved to your student portal. We will notify you when it is time to walk over.
            </div>
        </div>
    )
}

function ScreenStep3() {
    return (
        <div className="flex h-full flex-col justify-between p-4 text-slate-800 dark:text-slate-100">
            <div>
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-600 dark:text-brand-400">Ticket B42 Active</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Updates
                    </span>
                </div>

                {/* Circular Queue Tracker */}
                <div className="my-5 flex flex-col items-center justify-center">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-brand-500/20 bg-brand-50/50 dark:bg-slate-900 shadow-inner">
                        <div className="text-center">
                            <div className="text-2xl font-black text-brand-600 dark:text-brand-400">2</div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ahead of You</div>
                        </div>
                    </div>

                    <div className="mt-3 text-center">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Currently serving: Ticket B40
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Estimated time remaining: 4 minutes
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-center text-[11px] text-slate-600 dark:text-slate-400">
                You can study, grab lunch, or relax in your room while your position moves up.
            </div>
        </div>
    )
}

function ScreenStep4() {
    return (
        <div className="flex h-full flex-col justify-between p-4 text-slate-800 dark:text-slate-100">
            <div>
                <div className="text-center text-[11px] font-semibold text-slate-400">
                    Lock Screen Notification
                </div>

                {/* Mobile Notification Card */}
                <motion.div
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-slate-900 p-3.5 shadow-md"
                >
                    <div className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                            <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-amber-900 dark:text-amber-300">UniQueue Alert</span>
                                <span className="text-[10px] text-slate-500">Just now</span>
                            </div>
                            <div className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                                Your turn is coming up soon
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                                Ticket B42: You are 2nd in line. Please walk to Bursary Window 2 now.
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="mt-4 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-center">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Arrival Allowance
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        You have approximately 3 minutes to reach the counter comfortably.
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 py-2 text-center text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Audible chime alert played
            </div>
        </div>
    )
}

function ScreenStep5() {
    return (
        <div className="flex h-full flex-col justify-between p-4 text-slate-800 dark:text-slate-100 text-center">
            <div>
                <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <CheckCircle2 className="h-8 w-8" />
                </div>

                <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    Service Completed
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Tuition fee verification confirmed at Window 2
                </p>

                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-left space-y-1.5 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Service Duration</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">3 minutes 40 seconds</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Officer in Charge</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Mrs. Adeleke</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Clearance Status</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Approved</span>
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-slate-900 dark:bg-white py-2.5 text-xs font-bold text-white dark:text-slate-900">
                Done &bull; Return to Home
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════
//  MAIN PROCESS ANIMATION COMPONENT
// ═══════════════════════════════════════════════════════════

export default function Process3DAnimation() {
    const [activeStep, setActiveStep] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const containerRef = useRef(null)
    const reduceMotion = useReducedMotion()

    // Smooth subtle 3D tilt tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springConfig = { stiffness: 180, damping: 22 }
    const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig)
    const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig)

    const step = PROCESS_STEPS[activeStep]

    const handleMouseMove = (e) => {
        if (!containerRef.current || reduceMotion) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        mouseX.set(x)
        mouseY.set(y)
    }

    const handleMouseLeave = () => {
        mouseX.set(0)
        mouseY.set(0)
    }

    // Auto-advance loop every 6 seconds
    useEffect(() => {
        if (!isPlaying || reduceMotion) return
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % PROCESS_STEPS.length)
        }, 6000)
        return () => clearInterval(interval)
    }, [isPlaying, reduceMotion])

    const goPrev = () => {
        setActiveStep((prev) => (prev - 1 + PROCESS_STEPS.length) % PROCESS_STEPS.length)
    }

    const goNext = () => {
        setActiveStep((prev) => (prev + 1) % PROCESS_STEPS.length)
    }

    return (
        <section id="process" className="relative bg-slate-900 text-white py-20 sm:py-28 overflow-hidden">
            {/* Subtle background pattern */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
                        How It Works
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                        From your room to the front of the line
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        UniQueue separates waiting from physical presence. Follow the five steps that make university lines disappear.
                    </p>
                </div>

                {/* Step Selector Pills */}
                <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {PROCESS_STEPS.map((s, index) => {
                        const isActive = activeStep === index
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveStep(index)}
                                className={`relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-white text-slate-900 shadow-lg scale-105'
                                        : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                        isActive ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300'
                                    }`}
                                >
                                    {s.id}
                                </span>
                                <span>{s.title}</span>

                                {isActive && isPlaying && !reduceMotion && (
                                    <motion.div
                                        key={`bar-${activeStep}`}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 6, ease: 'linear' }}
                                        className="absolute -bottom-1 left-3 right-3 h-0.5 origin-left rounded-full bg-brand-500"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Main Interactive Stage */}
                <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">

                    {/* Left Column: Descriptive Information */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-brand-500/20 px-3 py-1 text-xs font-bold text-brand-300">
                            {step.stepNumber}: {step.subtitle}
                        </div>

                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                            {step.heading}
                        </h3>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            {step.description}
                        </p>

                        {/* Tangible Benefits */}
                        <div className="space-y-2.5 pt-2">
                            {step.benefits.map((benefit, i) => (
                                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                        ✓
                                    </div>
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>

                        {/* Practical Note */}
                        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4 text-xs text-slate-400 leading-relaxed">
                            <span className="font-semibold text-slate-200">Campus Experience:</span> {step.detail}
                        </div>

                        {/* Navigation and Playback Controls */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label="Previous step"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-white transition-all hover:bg-slate-700 active:scale-95 cursor-pointer"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-700 cursor-pointer"
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="h-3.5 w-3.5" /> Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-3.5 w-3.5" /> Resume
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={goNext}
                                aria-label="Next step"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-white transition-all hover:bg-slate-700 active:scale-95 cursor-pointer"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Realistic Phone Mockup with 3D Tilt */}
                    <div className="lg:col-span-6 flex justify-center [perspective:1200px]">
                        <motion.div
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                rotateX: reduceMotion ? 0 : tiltX,
                                rotateY: reduceMotion ? 0 : tiltY,
                                transformStyle: 'preserve-3d',
                            }}
                            className="relative w-full max-w-[320px] sm:max-w-[340px] rounded-[44px] border-4 border-slate-700/80 bg-slate-950 p-3 shadow-2xl transition-all"
                        >
                            {/* Phone Speaker Notch */}
                            <div className="mx-auto h-4 w-28 rounded-full bg-slate-800 mb-2 flex items-center justify-center">
                                <div className="h-1.5 w-8 rounded-full bg-slate-900" />
                            </div>

                            {/* Internal Phone Screen */}
                            <div className="h-[460px] sm:h-[480px] w-full rounded-[34px] bg-white dark:bg-slate-950 overflow-hidden relative shadow-inner border border-slate-200 dark:border-slate-800 flex flex-col">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeStep}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.28 }}
                                        className="h-full w-full"
                                    >
                                        {activeStep === 0 && <ScreenStep1 />}
                                        {activeStep === 1 && <ScreenStep2 />}
                                        {activeStep === 2 && <ScreenStep3 />}
                                        {activeStep === 3 && <ScreenStep4 />}
                                        {activeStep === 4 && <ScreenStep5 />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Phone Home Bar */}
                            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-slate-700" />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    )
}
