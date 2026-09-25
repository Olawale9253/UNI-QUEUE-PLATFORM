    import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Users,
    Building2,
    ShieldCheck,
    Clock,
    Bell,
    LineChart,
    Route as RouteIcon,
    Ticket,
    GraduationCap,
    CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const SLIDES = [
    {
        id: 'students',
        src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        alt: 'Students walking on a university campus',
        eyebrow: { icon: GraduationCap, label: 'For students' },
        headline: 'Skip the line.',
        headlineAccent: 'Not the service.',
        sub: 'Join a queue from your phone, watch your position in real time, and show up exactly when it’s your turn.',
        cta: { label: 'Get started free', to: '/register' },
        ctaSecondary: { label: 'Sign in', to: '/login' },
    },
    {
        id: 'freshers',
        src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
        alt: 'Student checking their phone',
        eyebrow: { icon: Sparkles, label: 'For freshers' },
        headline: 'Register before',
        headlineAccent: 'you get your matric.',
        sub: 'Sign up with your JAMB number the moment you’re admitted. Get your dashboard from day one — upgrade in one tap once your matric arrives.',
        cta: { label: 'Register as fresher', to: '/register' },
        ctaSecondary: { label: 'How it works', to: '#how-it-works' },
    },
    {
        id: 'staff',
        src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
        alt: 'Team collaborating at a bright office desk',
        eyebrow: { icon: Users, label: 'For staff' },
        headline: 'Serve more.',
        headlineAccent: 'Wait less.',
        sub: 'Call the next ticket, transfer students between desks, and mark service complete — all from one clean dashboard.',
        cta: { label: 'Explore staff tools', to: '/login' },
        ctaSecondary: { label: 'See a demo', to: '#features' },
    },
    {
        id: 'admins',
        src: 'https://images.unsplash.com/photo-1550305550-ff3ab47ab63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QWZyaWNhJTIwaW5zdGl0dXRpb25zJTIwc3R1ZGVudHMlMjBxdWV1ZXxlbnwwfHwwfHx8MA%3D%3D',
        alt: 'Administrator viewing analytics on a laptop',
        eyebrow: { icon: LineChart, label: 'For administrators' },
        headline: 'See every queue.',
        headlineAccent: 'At a glance.',
        sub: 'Live analytics, staff performance, wait times, and feedback — so you can fix bottlenecks before students feel them.',
        cta: { label: 'Register your university', to: '/register' },
        ctaSecondary: { label: 'Learn more', to: '#features' },
    },
]

const AUTO_ADVANCE_MS = 5000
const SLIDE_MS = 800
const SLIDE_COUNT = SLIDES.length

// Source-set with a wide range of sizes so browsers pick the fastest
// one that still looks sharp on their viewport.
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
    const [loaded, setLoaded] = useState(() => new Set())
    const [imageReady, setImageReady] = useState(() => new Set())
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
        setIndex((current) => ((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT)
    }, [])

    const next = useCallback(() => goTo(index + 1), [goTo, index])
    const prev = useCallback(() => goTo(index - 1), [goTo, index])

    // ─── Auto-advance ───
    // FIX: On remount (navigating back to home), the paused state resets to
    // false, so the timer always starts fresh.
    useEffect(() => {
        if (paused || reduceMotion) return
        const t = setTimeout(() => goTo(index + 1), AUTO_ADVANCE_MS)
        return () => clearTimeout(t)
    }, [index, paused, reduceMotion, goTo])

    // ─── Global mouse tracking (replaces onMouseEnter/onMouseLeave) ───
    // Only considers a hover "active" when the cursor actually MOVES inside
    // the section. Prevents the carousel from getting stuck paused when the
    // mouse happens to be sitting over the hero on remount.
    useEffect(() => {
        const onMove = (e) => {
            const el = sectionRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            setPaused((p) => (p === inside ? p : inside))
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        return () => window.removeEventListener('mousemove', onMove)
    }, [])

    // ─── Preload ALL slides on mount ───
    // Using `img.srcset` so the browser picks the right size for the current
    // viewport. By the time we're on slide 2+, every image is already cached.
    useEffect(() => {
        SLIDES.forEach((s, i) => {
            if (loaded.has(i)) return
            const img = new Image()
            img.srcset = buildSrcSet(s.src)
            img.sizes = '100vw'
            img.src = FULL_URL(s.src)
            img.onload = () => {
                setLoaded((prev) => {
                    if (prev.has(i)) return prev
                    const nxt = new Set(prev)
                    nxt.add(i)
                    return nxt
                })
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Keyboard nav
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') next()
            else if (e.key === 'ArrowLeft') prev()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [next, prev])

    return (
        <section
            ref={sectionRef}
            className="relative isolate h-[92vh] min-h-[600px] w-full overflow-hidden bg-slate-900"
            aria-roledescription="carousel"
            aria-label="Product highlights"
        >
            <motion.div
                className="absolute inset-0 flex"
                animate={{ x: `-${index * 100}%` }}
                transition={{
                    duration: reduceMotion ? 0 : SLIDE_MS / 1000,
                    ease: [0.83, 0, 0.17, 1],
                }}
            >
                {SLIDES.map((s, i) => {
                    const isLoaded = imageReady.has(i)
                    const isActive = i === index
                    return (
                        <div
                            key={s.id}
                            className="relative h-full w-full shrink-0 overflow-hidden"
                            aria-hidden={!isActive}
                        >
                            {/* ─── Skeleton shimmer while the image loads ─── */}
                            <div
                                className={`absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 transition-opacity duration-500 ${
                                    isLoaded ? 'opacity-0' : 'opacity-100'
                                }`}
                            >
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
                                />
                            </div>

                            {/* ─── Image ─── */}
                            <img
                                src={FULL_URL(s.src)}
                                srcSet={buildSrcSet(s.src)}
                                sizes="100vw"
                                alt={s.alt}
                                loading={i === 0 ? 'eager' : 'lazy'}
                                fetchPriority={i === 0 ? 'high' : undefined}
                                decoding="async"
                                onLoad={() =>
                                    setImageReady((prev) => {
                                        if (prev.has(i)) return prev
                                        const nxt = new Set(prev)
                                        nxt.add(i)
                                        return nxt
                                    })
                                }
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                                    isLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                draggable={false}
                            />

                            {/* ─── Gradient overlays ─── */}
                            <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    background:
                                        'linear-gradient(to right, rgba(2,6,23,0.90) 0%, rgba(2,6,23,0.76) 28%, rgba(2,6,23,0.40) 50%, rgba(2,6,23,0.08) 72%, rgba(2,6,23,0) 100%)',
                                }}
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent" />

                            {/* ─── Text content ─── */}
                            <div className="absolute inset-0 z-10 mx-auto flex max-w-7xl flex-col justify-center px-6 sm:px-8 lg:px-12">
                                <div className="max-w-2xl">
                                    {/* ─── Professional role badge ─── */}
                                    <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-1.5 pr-4 shadow-xl shadow-black/25 backdrop-blur-xl">
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-md shadow-brand-600/40">
                      <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/40" />
                      <s.eyebrow.icon className="relative h-3.5 w-3.5 text-white" />
                    </span>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                      {s.eyebrow.label}
                    </span>
                                    </div>

                                    <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl">
                                        {s.headline}
                                        <span className="block bg-gradient-to-r from-brand-300 via-brand-400 to-brand-200 bg-clip-text text-transparent">
                      {s.headlineAccent}
                    </span>
                                    </h1>

                                    <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 drop-shadow-lg sm:text-lg">
                                        {s.sub}
                                    </p>

                                    <div className="mt-9 flex flex-wrap items-center gap-3">
                                        <Link
                                            to={dashboardHref || s.cta.to}
                                            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/25 transition-all hover:bg-slate-100 hover:shadow-xl"
                                        >
                                            {dashboardHref ? 'Go to dashboard' : s.cta.label}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                        <Link
                                            to={s.ctaSecondary.to}
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/20"
                                        >
                                            {s.ctaSecondary.label}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </motion.div>

            {/* ─── Arrows ─── */}
            <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="group absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/20 lg:flex"
            >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="group absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/20 lg:flex"
            >
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* ─── Dots + progress ─── */}
            <div className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2.5">
                    {SLIDES.map((s, i) => {
                        const isActive = i === index
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => goTo(i)}
                                aria-label={`Go to slide ${i + 1}`}
                                className="group relative h-1.5 overflow-hidden rounded-full bg-white/30 transition-all"
                                style={{ width: isActive ? 40 : 12 }}
                            >
                <span
                    className={`absolute inset-0 rounded-full transition-colors ${
                        isActive ? 'bg-white' : 'bg-white/60 group-hover:bg-white'
                    }`}
                />
                                {isActive && !paused && !reduceMotion && (
                                    <motion.span
                                        key={`progress-${index}`}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                                        className="absolute inset-0 origin-left rounded-full bg-brand-300"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
                    {String(index + 1).padStart(2, '0')} / {String(SLIDE_COUNT).padStart(2, '0')}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  FEATURES
// ═══════════════════════════════════════════════════════════
const FEATURES = [
    {
        icon: Ticket,
        title: 'Virtual ticketing',
        body: 'Students join from anywhere and get a ticket with live position and estimated wait time.',
    },
    {
        icon: Bell,
        title: 'Real-time notifications',
        body: 'Push alerts the moment it’s their turn — no more crowded corridors or missed calls.',
    },
    {
        icon: RouteIcon,
        title: 'Multi-step workflows',
        body: 'Chain queues into clearance processes. Each step unlocks the next automatically.',
    },
    {
        icon: GraduationCap,
        title: 'Fresher onboarding',
        body: 'New students register with their JAMB number before they have a matric.',
    },
    {
        icon: LineChart,
        title: 'Deep analytics',
        body: 'Wait times, no-show rates, staff performance, and demand trends — per queue.',
    },
    {
        icon: ShieldCheck,
        title: 'Multi-tenant & secure',
        body: 'Each university gets isolated data, custom branding, and role-based access.',
    },
]

function Features() {
    return (
        <section id="features" className="relative bg-white py-24 sm:py-32 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
            <Sparkles className="h-3 w-3" />
            Everything you need
          </span>
                    <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                        Built for how universities actually work
                    </h2>
                    <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
                        One platform for students, staff, and administrators — with the tools each
                        role needs, without the clutter.
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon
                        return (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800"
                            >
                                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/40 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {f.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {f.body}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  HOW IT WORKS
// ═══════════════════════════════════════════════════════════
const STEPS = [
    {
        n: '01',
        title: 'Join a queue',
        body: 'Pick a department — Bursary, Registry, Library — and tap “Join”. You get a ticket instantly.',
    },
    {
        n: '02',
        title: 'Track your spot',
        body: 'Watch your position and estimated wait time update live. Go grab coffee — you’ll be notified.',
    },
    {
        n: '03',
        title: 'Show up on time',
        body: 'You get an alert when it’s your turn. Walk in, get served, done — no waiting room involved.',
    },
]

function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="relative overflow-hidden bg-slate-50 py-24 sm:py-32 dark:bg-slate-900"
        >
            <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-3 w-3" />
            How it works
          </span>
                    <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                        Three steps. Zero waiting rooms.
                    </h2>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.n}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative"
                        >
                            <div className="text-6xl font-black tracking-tight text-brand-200 dark:text-brand-900/60">
                                {s.n}
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {s.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {s.body}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  CTA
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
        <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/40 via-slate-950 to-slate-950" />
            <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8">
                <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30">
                    <Building2 className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                    Ready to end the queue?
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
                    Join the universities using UniQueue to serve students faster, cut
                    waiting-room chaos, and see every desk in real time.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        to={dashboardHref || '/register'}
                        className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 hover:shadow-xl"
                    >
                        {dashboardHref ? 'Go to dashboard' : 'Get started free'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/10"
                    >
                        Sign in
                    </Link>
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs text-slate-400">
                    {['No credit card required', 'Free tier for small universities', 'Set up in under 10 minutes'].map(
                        (item) => (
                            <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                                {item}
              </span>
                        )
                    )}
                </div>
            </div>
        </section>
    )
}

export default function Home() {
    return (
        <div className="bg-white dark:bg-slate-950">
            <HeroCarousel />
            <Features />
            <HowItWorks />
            <FinalCTA />
        </div>
    )
}