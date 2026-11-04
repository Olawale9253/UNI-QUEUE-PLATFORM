import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Users,
    Building2,
    ShieldCheck,
    Bell,
    LineChart,
    Route as RouteIcon,
    Ticket,
    GraduationCap,
    CheckCircle2,
    ArrowRight,
    Check,
    X,
    ChevronDown,
    Smartphone,
    Zap,
    Shield,
    HelpCircle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/layout/Footer'
import Process3DAnimation from '../components/landing/Process3DAnimation'

// ═══════════════════════════════════════════════════════════
//  HERO CAROUSEL
// ═══════════════════════════════════════════════════════════

const SLIDES = [
    {
        id: 'students',
        src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        alt: 'Students walking on a university campus',
        eyebrow: { icon: GraduationCap, label: 'For students' },
        headline: 'Skip the physical line.',
        headlineAccent: 'Reclaim your day.',
        sub: 'Join campus queues directly from your dorm or lecture hall, track your position live, and arrive at the counter exactly when your number is called.',
        cta: { label: 'Explore campus queues', to: '/register' },
        ctaSecondary: { label: 'Sign in to portal', to: '/login' },
        tags: ['Live position updates', 'Audio arrival chimes', 'Clearance progress tracking'],
    },
    {
        id: 'freshers',
        src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
        alt: 'Student checking their phone',
        eyebrow: { icon: Sparkles, label: 'For newly admitted freshers' },
        headline: 'Register before',
        headlineAccent: 'your matric number arrives.',
        sub: 'Sign up with your JAMB number the day you receive admission. Access orientation queues and departmental desks immediately, then link your matriculation number when issued.',
        cta: { label: 'Register with JAMB number', to: '/register' },
        ctaSecondary: null,
        tags: ['Direct JAMB registration', 'First day campus access', 'One tap matric link'],
    },
    {
        id: 'staff',
        src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
        alt: 'Team collaborating at a bright office desk',
        eyebrow: { icon: Users, label: 'For university staff' },
        headline: 'Serve faster.',
        headlineAccent: 'Quiet, organized desks.',
        sub: 'Call tickets with a single click, review student clearance documents, and transfer students between counters smoothly from a clean workstation dashboard.',
        cta: { label: 'Access staff desk', to: '/login' },
        ctaSecondary: null,
        tags: ['Single click calling', 'Digital document review', 'Counter transfers'],
    },
    {
        id: 'admins',
        src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
        alt: 'Graduating students celebrating',
        eyebrow: { icon: LineChart, label: 'For campus administrators' },
        headline: 'See every queue.',
        headlineAccent: 'Fix bottlenecks early.',
        sub: 'Live wait times across departments, desk transaction rates, and verified student feedback. Spot congestion and optimize desk allocations before hallways crowd.',
        cta: { label: 'Register your university', to: '/for-universities' },
        ctaSecondary: null,
        tags: ['Real time desk overview', 'Protected campus spaces', 'Service turnaround analytics'],
    },
]

const AUTO_ADVANCE_MS = 6000
const SLIDE_MS = 750
const SLIDE_COUNT = SLIDES.length

function buildSrcSet(baseUrl) {
    return [
        `${baseUrl}?auto=format&fit=crop&q=80&w=640&dpr=2 640w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=1024&dpr=2 1024w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=1440&dpr=2 1440w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=1920&dpr=2 1920w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=2560&dpr=2 2560w`,
    ].join(', ')
}
const FULL_URL = (base) => `${base}?auto=format&fit=crop&q=80&w=1920&dpr=2`

function HeroCarousel() {
    const sectionRef = useRef(null)
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const [imageReady, setImageReady] = useState(() => new Set())
    const preloaded = useRef(false)
    const reduceMotion = useReducedMotion()
    const { user } = useAuthStore()

    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
        FRESHER: '/student',
    }
    const dashboardHref = user ? dashboards[user.role] || '/' : null

    const goTo = useCallback((next) => {
        setIndex(((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT)
    }, [])

    const next = useCallback(() => goTo(index + 1), [goTo, index])
    const prev = useCallback(() => goTo(index - 1), [goTo, index])

    useEffect(() => {
        if (paused || reduceMotion) return
        const token = setTimeout(() => goTo(index + 1), AUTO_ADVANCE_MS)
        return () => clearTimeout(token)
    }, [index, paused, reduceMotion, goTo])

    useEffect(() => {
        const onMove = (entry) => {
            const el = sectionRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const inside =
                entry.clientX >= rect.left &&
                entry.clientX <= rect.right &&
                entry.clientY >= rect.top &&
                entry.clientY <= rect.bottom
            setPaused((item) => (item === inside ? item : inside))
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        return () => window.removeEventListener('mousemove', onMove)
    }, [])

    useEffect(() => {
        if (preloaded.current) return
        preloaded.current = true
        SLIDES.forEach((item) => {
            const img = new Image()
            img.srcset = buildSrcSet(item.src)
            img.sizes = '100vw'
            img.src = FULL_URL(item.src)
        })
    }, [])

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'ArrowRight') next()
            else if (event.key === 'ArrowLeft') prev()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [next, prev])

    return (
        <section
            ref={sectionRef}
            className="relative isolate min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] w-full overflow-hidden bg-slate-950 text-white"
            aria-roledescription="carousel"
            aria-label="UniQueue overview highlights"
        >
            <motion.div
                className="absolute inset-0 flex"
                animate={{ x: `-${index * 100}%` }}
                transition={{
                    duration: reduceMotion ? 0 : SLIDE_MS / 1000,
                    ease: [0.83, 0, 0.17, 1],
                }}
            >
                {SLIDES.map((item, indexValue) => {
                    const isLoaded = imageReady.has(indexValue)
                    const isActive = indexValue === index
                    return (
                        <div
                            key={item.id}
                            className="relative h-full w-full shrink-0 overflow-hidden"
                            aria-hidden={!isActive}
                        >
                            {/* Placeholder skeleton while loading */}
                            <div
                                className={`absolute inset-0 overflow-hidden bg-slate-900 transition-opacity duration-500 ${
                                    isLoaded ? 'opacity-0' : 'opacity-100'
                                }`}
                            />

                            {/* Background Image */}
                            <img
                                src={FULL_URL(item.src)}
                                srcSet={buildSrcSet(item.src)}
                                sizes="100vw"
                                alt={item.alt}
                                loading={indexValue === 0 ? 'eager' : 'lazy'}
                                fetchPriority={indexValue === 0 ? 'high' : undefined}
                                decoding="async"
                                onLoad={() =>
                                    setImageReady((prev) => {
                                        if (prev.has(indexValue)) return prev
                                        const nxt = new Set(prev)
                                        nxt.add(indexValue)
                                        return nxt
                                    })
                                }
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                                    isLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                draggable={false}
                            />

                            {/* Gradient Overlays for High Legibility */}
                            <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    background:
                                        'linear-gradient(to right, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.86) 38%, rgba(15,23,42,0.52) 68%, rgba(15,23,42,0.2) 100%)',
                                }}
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/60 to-transparent" />

                            {/* Slide Content */}
                            <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
                                <div className="max-w-2xl lg:max-w-3xl">
                                    {/* Eyebrow Pill */}
                                    <div className="mb-4 sm:mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2.5 pr-4 shadow-lg backdrop-blur-md">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                                            <item.eyebrow.icon className="h-3.5 w-3.5" />
                                        </span>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-white">
                                            {item.eyebrow.label}
                                        </span>
                                    </div>

                                    {/* Main Headline */}
                                    <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
                                        {item.headline}{' '}
                                        <span className="block text-brand-300">
                                            {item.headlineAccent}
                                        </span>
                                    </h1>

                                    {/* Subtitle */}
                                    <p className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base leading-relaxed text-slate-200 drop-shadow-sm">
                                        {item.sub}
                                    </p>

                                    {/* Key Benefits */}
                                    {item.tags && (
                                        <div className="mt-5 flex flex-wrap items-center gap-2">
                                            {item.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Call to Actions */}
                                    <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                                        <Link
                                            to={dashboardHref || item.cta.to}
                                            className="group inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-500 hover:scale-105 active:scale-95"
                                        >
                                            {dashboardHref ? 'Open dashboard' : item.cta.label}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>

                                        {item.ctaSecondary && !dashboardHref && (
                                            <Link
                                                to={item.ctaSecondary.to}
                                                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/40"
                                            >
                                                {item.ctaSecondary.label}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </motion.div>

            {/* Carousel Arrow Controls */}
            <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="group absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-900/60 p-3.5 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 lg:flex cursor-pointer"
            >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="group absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-900/60 p-3.5 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 lg:flex cursor-pointer"
            >
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Slide Indicators with Progress Bar */}
            <div className="absolute inset-x-0 bottom-6 sm:bottom-8 z-20 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                    {SLIDES.map((itemValue, indexValue2) => {
                        const isActive = indexValue2 === index
                        return (
                            <button
                                key={itemValue.id}
                                type="button"
                                onClick={() => goTo(indexValue2)}
                                aria-label={`Go to slide ${indexValue2 + 1}`}
                                className="group relative h-2 overflow-hidden rounded-full bg-white/25 transition-all cursor-pointer"
                                style={{ width: isActive ? 44 : 14 }}
                            >
                                <span
                                    className={`absolute inset-0 rounded-full transition-colors ${
                                        isActive ? 'bg-white' : 'bg-white/50 group-hover:bg-white'
                                    }`}
                                />
                                {isActive && !paused && !reduceMotion && (
                                    <motion.span
                                        key={`progress-${index}`}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{
                                            duration: AUTO_ADVANCE_MS / 1000,
                                            ease: 'linear',
                                        }}
                                        className="absolute inset-0 origin-left rounded-full bg-brand-400"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  STATS BANNER
// ═══════════════════════════════════════════════════════════

const STATS = [
    { value: '85%', label: 'Hallway Congestion Reduced', sub: 'Students wait in dorms or library' },
    { value: 'Under 4 min', label: 'Average Desk Service Time', sub: 'Faster counter turnaround' },
    { value: 'Day 1 Access', label: 'Fresher Registration with JAMB', sub: 'Join before matric is issued' },
    { value: '100% Digital', label: 'Clearance Approvals', sub: 'No paper clearance marathons' },
]

function StatsBanner() {
    return (
        <section className="relative z-20 border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="text-center sm:text-left">
                            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                {stat.label}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {stat.sub}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  PRODUCT SHOWCASE: DIGITAL TICKET & CLEARANCE PIPELINE
// ═══════════════════════════════════════════════════════════

function LiveExperienceShowcase() {
    return (
        <section className="relative overflow-hidden bg-slate-50 py-16 sm:py-24 dark:bg-slate-950">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300">
                        <Smartphone className="h-3.5 w-3.5" />
                        Campus Operations
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Designed for students, desk officers, and campus administrators
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Two core systems modernize campus visits: remote digital queuing and automated multi office clearance flows.
                    </p>
                </div>

                {/* Dual Showcase Cards */}
                <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">

                    {/* Card 1: The Live Digital Ticket */}
                    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                                    <Ticket className="h-3.5 w-3.5" /> Digital Ticket System
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Status
                                </span>
                            </div>

                            <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                Reserve your spot from your phone and walk in when called
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Join lines while resting in your hostel, attending lectures, or studying. Your ticket updates as students finish at the counter.
                            </p>

                            {/* Digital Ticket Representation */}
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Student Accounts and Bursary
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            Window 2: Tuition Clearance
                                        </div>
                                    </div>
                                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                        Confirmed
                                    </span>
                                </div>

                                <div className="my-4 flex items-baseline justify-between">
                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Your Ticket
                                        </div>
                                        <div className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                                            Ticket B42
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Currently Serving
                                        </div>
                                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                            Ticket B40
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-700 dark:text-slate-300">2 students ahead of you</span>
                                        <span className="text-brand-600 dark:text-brand-400 font-bold">4 minutes remaining</span>
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div className="h-full w-4/5 rounded-full bg-brand-500" />
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <Bell className="h-3.5 w-3.5 text-brand-500" />
                                        <span>Audible arrival alert sounds before your turn</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                            Works on any smartphone browser with no installation required
                        </div>
                    </div>

                    {/* Card 2: Multi-Department Clearance Workflow */}
                    <div id="clearance" className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                    <RouteIcon className="h-3.5 w-3.5" /> Clearance Workflows
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Final Year Clearance
                                </span>
                            </div>

                            <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                Sequential departmental clearance without the physical marathon
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Avoid running between offices under the hot sun with paper booklets. Each department signs off online and unlocks the next stage automatically.
                            </p>

                            {/* Clearance Steps Representation */}
                            <div className="mt-6 space-y-2.5">
                                {[
                                    { step: '1', title: 'Department Head Approval', status: 'Approved', state: 'done' },
                                    { step: '2', title: 'University Library Clearance', status: 'Approved', state: 'done' },
                                    { step: '3', title: 'Bursary Fee Reconciliation', status: 'In Progress (Ticket B42)', state: 'active' },
                                    { step: '4', title: 'Hostel and Accommodation', status: 'Next in Sequence', state: 'pending' },
                                    { step: '5', title: 'University Registry Endorsement', status: 'Scheduled', state: 'pending' },
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className={`flex items-center justify-between rounded-xl border p-3 text-xs sm:text-sm font-semibold transition-all ${
                                            item.state === 'done'
                                                ? 'border-emerald-200 bg-emerald-50/60 text-slate-800 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-200'
                                                : item.state === 'active'
                                                ? 'border-brand-300 bg-brand-50 text-brand-900 shadow-sm dark:border-brand-700 dark:bg-brand-950/40 dark:text-brand-200'
                                                : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                    item.state === 'done'
                                                        ? 'bg-emerald-600 text-white'
                                                        : item.state === 'active'
                                                        ? 'bg-brand-600 text-white'
                                                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {item.state === 'done' ? '✓' : item.step}
                                            </span>
                                            <span>{item.title}</span>
                                        </div>
                                        <span className="text-xs font-bold">{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                            Clearance progresses sequentially with verifiable timestamps for each office
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  THE TRADITIONAL LINE VS THE UNIQUEUE WAY
// ═══════════════════════════════════════════════════════════

function OldWayVsNewWay() {
    return (
        <section id="comparison" className="relative bg-white py-16 sm:py-24 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        Campus Comparison
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Traditional queues vs UniQueue
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Why physical lines disrupt student learning, and how digital management solves it.
                    </p>
                </div>

                {/* Comparison Grid */}
                <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">

                    {/* The Traditional Way */}
                    <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8 dark:border-rose-900/40 dark:bg-rose-950/20">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                            <X className="h-4 w-4" /> Traditional Physical Queues
                        </div>

                        <ul className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            {[
                                'Waking up at early dawn to write names on informal paper lists pinned to office doors.',
                                'Standing three to four hours in hot, overcrowded hallways without seating or airflow.',
                                'Missing lectures and laboratory practicals to protect a physical spot in line.',
                                'Waiting hours only to find that the desk officer stepped out for an unscheduled meeting.',
                                'Paper clearance forms getting damaged or misplaced, holding up graduation.',
                            ].map((point, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                        <X className="h-3 w-3" />
                                    </div>
                                    <span className="leading-relaxed">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* The UniQueue Way */}
                    <div className="rounded-3xl border border-emerald-300 bg-emerald-50/40 p-6 sm:p-8 dark:border-emerald-800/50 dark:bg-emerald-950/20 shadow-sm">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <Check className="h-4 w-4" /> The UniQueue Experience
                        </div>

                        <ul className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            {[
                                'Join lines in two taps from your phone while resting in your hostel or studying.',
                                'Watch your spot move up live with honest wait time projections.',
                                'Receive clear audio chimes and notifications when you are two spots away from being called.',
                                'Check which counters are actively open before you begin walking across campus.',
                                'Sequential clearance flows guide you through each department digitally with verifiable logs.',
                            ].map((point, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span className="leading-relaxed font-medium">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  CORE FEATURES SECTION
// ═══════════════════════════════════════════════════════════

const FEATURES = [
    {
        icon: Ticket,
        badge: 'Digital Queuing',
        title: 'Real Time Ticket Tracking',
        body: 'Students join lines from their phones and follow their position live. Wait times adjust accurately as staff attend to students.',
    },
    {
        icon: RouteIcon,
        badge: 'Clearance Flows',
        title: 'Departmental Clearance Chains',
        body: 'Connect Bursary, Library, Faculty, and Registry offices into orderly digital flows where each approval unlocks the next step.',
    },
    {
        icon: Sparkles,
        badge: 'Fresher Registration',
        title: 'Immediate Onboarding with JAMB',
        body: 'Newly admitted students sign up using their JAMB details before matriculation numbers are generated, eliminating orientation delays.',
    },
    {
        icon: Bell,
        badge: 'Smart Alerts',
        title: 'Proactive Arrival Notifications',
        body: 'Audible arrival chimes and notifications sound on student devices when their turn approaches, preventing noisy, crowded hallways.',
    },
    {
        icon: Users,
        badge: 'Staff Tools',
        title: 'Organized Counter Workstation',
        body: 'Staff call the next student, hold tickets for students in transit, and transfer students between desks with clear records.',
    },
    {
        icon: ShieldCheck,
        badge: 'Campus Security',
        title: 'Protected Campus Spaces',
        body: 'Each university operates in an independent workspace with tailored branding, custom offices, and protected student records.',
    },
]

function Features() {
    return (
        <section id="features" className="relative bg-slate-50 py-16 dark:bg-slate-950 sm:py-24 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-400">
                        <Sparkles className="h-3 w-3" />
                        Comprehensive Platform
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
                        Engineered for daily university administration
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        A reliable platform connecting students, desk officers, and campus administrators seamlessly.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((item, index) => {
                        const Icon = item.icon
                        return (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.45, delay: index * 0.05 }}
                                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/40 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        {item.body}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  ROLE PERSPECTIVES
// ═══════════════════════════════════════════════════════════

const ROLES = [
    {
        id: 'student',
        label: 'Students & Freshers',
        title: 'Spend your day studying and learning, not queuing in hallways.',
        desc: 'Whether clearing admission requirements with your JAMB number or completing final year clearance for graduation, manage campus visits directly from your phone.',
        bullets: [
            'Join any open university line from your phone in seconds',
            'Watch your position update live without refreshing or calling',
            'Upload clearance credentials securely for staff verification',
            'Schedule dedicated consultation appointments with advisers',
        ],
        ctaText: 'Sign up for free',
        ctaLink: '/register',
    },
    {
        id: 'staff',
        label: 'Desk Officers & Staff',
        title: 'Manage queues calmly with quiet corridors and clear records.',
        desc: 'Empower desk staff with a focused workstation interface. Eliminate shouting over noisy crowds, lost paper sign up sheets, and constant interruptions.',
        bullets: [
            'Call the next ticket with a single click or keyboard shortcut',
            'Transfer students to another counter with one tap',
            'Review and approve uploaded student verification documents',
            'Hold tickets briefly for students walking over without losing order',
        ],
        ctaText: 'Staff Desk Login',
        ctaLink: '/login',
    },
    {
        id: 'admin',
        label: 'Department Administrators',
        title: 'Complete oversight of office throughput and waiting times.',
        desc: 'Understand student demand patterns, address bottleneck departments during peak registration weeks, and gather verified student service ratings.',
        bullets: [
            'Real time overview of student traffic across all offices',
            'Configure sequential clearance rules for graduation and hostels',
            'Monitor service durations, no show rates, and completion times',
            'Send broadcast updates to all students currently waiting',
        ],
        ctaText: 'Admin Console',
        ctaLink: '/login',
    },
    {
        id: 'executive',
        label: 'University Leadership',
        title: 'Transform your campus with modern, organized administrative services.',
        desc: 'Upgrade your institution into a modern smart campus. Deploy an isolated cloud environment with custom branding and institutional reliability.',
        bullets: [
            'Dedicated campus subdomain and university identity branding',
            'Protected student data isolation with institutional compliance',
            'Fast setup in under 24 hours with no engineering team needed',
            'Free starting tier with affordable plans for institutions',
        ],
        ctaText: 'Register your university',
        ctaLink: '/for-universities',
    },
]

function RoleShowcase() {
    const [activeRole, setActiveRole] = useState(0)
    const role = ROLES[activeRole]

    return (
        <section id="freshers" className="relative bg-white py-16 sm:py-24 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300">
                        <Users className="h-3.5 w-3.5" /> Tailored Portals
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Built for everyone on campus
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        See how UniQueue simplifies the daily routine of students, staff, and campus leadership.
                    </p>
                </div>

                {/* Role Tabs */}
                <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
                    {ROLES.map((item, idx) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveRole(idx)}
                            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                activeRole === idx
                                    ? 'bg-brand-600 text-white shadow-md scale-105'
                                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Card */}
                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-7">
                            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                                {role.label}
                            </span>
                            <h3 className="mt-2 text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                                {role.title}
                            </h3>
                            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                {role.desc}
                            </p>

                            <div className="mt-6 space-y-3">
                                {role.bullets.map((bullet, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                            ✓
                                        </div>
                                        <span>{bullet}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8">
                                <Link
                                    to={role.ctaLink}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:scale-105 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                >
                                    {role.ctaText}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Practical Specification Box */}
                        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                                        Campus Security and Access
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Protected role based permissions
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-medium">Authentication</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Secure student session</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-medium">Position Tracking</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Live queue synchronization</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-medium">University Data</span>
                                    <span className="font-bold text-brand-600 dark:text-brand-400">Isolated per campus</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="font-medium">Device Compatibility</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Mobile, tablet, and desktop</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  FREQUENTLY ASKED QUESTIONS
// ═══════════════════════════════════════════════════════════

const FAQS = [
    {
        q: 'Can freshers register before getting their university matriculation number?',
        a: 'Yes. UniQueue supports newly admitted freshers from day one. You can create an account using your official JAMB registration number upon admission. When the university issues your matriculation number, you can link it to your profile in one tap without losing your queue or clearance history.',
    },
    {
        q: 'How will I know when to walk over to the counter?',
        a: 'UniQueue provides continuous position tracking based on staff calling speed. When you are two students away from being called, your phone rings an audible chime and displays an arrival alert, giving you plenty of time to walk over comfortably.',
    },
    {
        q: 'What happens if I arrive slightly late when my number is called?',
        a: 'UniQueue includes a desk hold feature. Staff members can place your ticket on a temporary hold rather than cancelling it immediately, allowing you to check in as soon as you step into the room.',
    },
    {
        q: 'How does UniQueue handle multi office clearance for graduation?',
        a: 'University administrators configure clearance chains where each office reviews student records digitally. As each department signs off, the next office queue unlocks automatically, removing the need to run between campus buildings with paper booklets.',
    },
    {
        q: 'How does a university partner with or onboard onto UniQueue?',
        a: 'University representatives can submit an application on our For Universities page. We set up an isolated campus instance with your branding, departments, and staff accounts in under 24 hours. A generous free tier is available to start immediately.',
    },
]

function FAQSection() {
    const [openIdx, setOpenIdx] = useState(0)

    const toggle = (idx) => {
        setOpenIdx((prev) => (prev === idx ? null : idx))
    }

    return (
        <section id="faq" className="relative bg-slate-50 py-16 sm:py-24 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-brand-300">
                        <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Common questions about UniQueue
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Everything you need to know about using digital queues on your campus.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="mt-10 sm:mt-12 space-y-4">
                    {FAQS.map((faq, idx) => {
                        const isOpen = openIdx === idx
                        return (
                            <div
                                key={idx}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(idx)}
                                    className="flex w-full items-center justify-between p-5 sm:p-6 text-left font-bold text-slate-900 transition-colors hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400 cursor-pointer"
                                >
                                    <span className="text-sm sm:text-base pr-4">{faq.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                                            isOpen ? 'rotate-180 text-brand-600' : ''
                                        }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="border-t border-slate-100 px-5 pb-5 pt-3 sm:px-6 sm:pb-6 text-xs sm:text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  FINAL CTA
// ═══════════════════════════════════════════════════════════

function FinalCTA() {
    const { user } = useAuthStore()
    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
        FRESHER: '/student',
    }
    const dashboardHref = user ? dashboards[user.role] || '/' : null

    return (
        <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28 text-white">
            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8">
                <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30">
                    <Building2 className="h-7 w-7 text-white" />
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                    End the campus line today
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
                    Join thousands of students and leading universities using UniQueue to eliminate physical lines, speed up departmental clearances, and create a calm campus environment.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Link
                        to={dashboardHref || '/register'}
                        className="group inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-500 hover:scale-105 active:scale-95"
                    >
                        {dashboardHref ? 'Open dashboard' : 'Get started free'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    {!user && (
                        <Link
                            to="/for-universities"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                        >
                            Register your university
                        </Link>
                    )}
                </div>

                <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-slate-400">
                    {[
                        'No credit card required',
                        'Free tier for universities',
                        'Zero app store download needed',
                        'Set up in under 10 minutes',
                    ].map((item) => (
                        <span key={item} className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-brand-400" />
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  PAGE ROOT
// ═══════════════════════════════════════════════════════════

export default function Home() {
    return (
        <div className="h-full overflow-y-auto bg-white dark:bg-slate-950">
            <HeroCarousel />
            <StatsBanner />
            <LiveExperienceShowcase />
            <OldWayVsNewWay />
            <Features />
            <RoleShowcase />
            <Process3DAnimation />
            <FAQSection />
            <FinalCTA />
            <Footer />
        </div>
    )
}
