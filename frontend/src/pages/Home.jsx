import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, BarChart3, Bell, ShieldCheck, Users, Ticket } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ease, fadeUp, stagger, staggerItem } from '../lib/motion'

const features = [
    {
        icon: Ticket,
        title: 'Virtual queue tickets',
        description:
            'Students join a queue from anywhere and receive a digital ticket with their live position.',
    },
    {
        icon: Bell,
        title: 'Real-time notifications',
        description:
            'Automatic alerts when a student is next in line, when a slot opens, or when service completes.',
    },
    {
        icon: BarChart3,
        title: 'Operational analytics',
        description:
            'Administrators get per-queue wait times, staff performance, no-show rates, and daily trends.',
    },
    {
        icon: ShieldCheck,
        title: 'Role-based access',
        description:
            'Super admins, university admins, staff, and students each see exactly what they should.',
    },
    {
        icon: Users,
        title: 'Multi-tenant by design',
        description:
            'Each university operates independently with isolated data, branding, and configuration.',
    },
    {
        icon: Clock,
        title: 'Appointments & workflows',
        description:
            'Beyond queues: scheduled 1-on-1 appointments and multi-step clearance chains.',
    },
]

export default function Home() {
    const { user } = useAuthStore()
    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
    }

    return (
        <div>
            <section className="relative overflow-hidden border-b border-slate-200 bg-white">
                {/* Ambient gradient blob */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease }}
                    className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-indigo-100/60 blur-3xl"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, delay: 0.1, ease }}
                    className="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-sky-100/60 blur-3xl"
                />

                <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
                    <div className="mx-auto max-w-3xl text-center">
                        <motion.div
                            variants={fadeUp}
                            initial="initial"
                            animate="animate"
                            className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur"
                        >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
                            Now serving universities across Nigeria
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.05, duration: 0.55, ease }}
                            className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
                        >
                            Skip the line.
                            <span className="block text-indigo-600">Not the service.</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.12, duration: 0.55, ease }}
                            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600"
                        >
                            UniQueue is a multi-tenant queue management platform for universities.
                            Students join virtual queues, staff serve them efficiently, and
                            administrators gain visibility into every desk.
                        </motion.p>

                        <motion.div
                            variants={fadeUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.2, duration: 0.55, ease }}
                            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                        >
                            {user ? (
                                <Link
                                    to={dashboards[user.role] || '/'}
                                    className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
                                >
                                    Go to dashboard
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/register"
                                        className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
                                    >
                                        Get started
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-50 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.5, ease }}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Everything a modern university desk needs
                        </h2>
                        <p className="mt-3 text-slate-600">
                            Designed from the ground up for the way university services actually work.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={stagger(0.1, 0.06)}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-60px' }}
                        className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {features.map((f) => (
                            <motion.div
                                key={f.title}
                                variants={staggerItem}
                                whileHover={{ y: -4, boxShadow: '0 12px 30px -12px rgba(15,23,42,0.15)' }}
                                transition={{ duration: 0.2 }}
                                className="rounded-xl border border-slate-200 bg-white p-6"
                            >
                                <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-2.5">
                                    <f.icon className="h-5 w-5 text-indigo-600" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    {f.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    {f.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="border-t border-slate-200 bg-white py-20">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, ease }}
                    className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
                >
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Ready to modernise your campus queues?
                    </h2>
                    <p className="mt-3 text-slate-600">
                        Register your university in minutes. No installation required.
                    </p>
                    {!user && (
                        <Link
                            to="/register"
                            className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-md"
                        >
                            Create your account
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    )}
                </motion.div>
            </section>

            <footer className="border-t border-slate-200 bg-slate-50 py-8">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
                    <div>© {new Date().getFullYear()} UniQueue. All rights reserved.</div>
                    <div>Built for universities.</div>
                </div>
            </footer>
        </div>
    )
}