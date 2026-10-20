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
        <section className="relative overflow-hidden bg-[#0f172a] py-24 sm:py-32">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/40 via-[#0f172a] to-[#0f172a]" />
            <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8">
                <div className="mx-auto mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30">
                    <Building2 className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                    Ready to end the queue?
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
                    Join the universities using UniQueue to serve students faster, cut waiting-room chaos, and see every desk in real time.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4">
                    <Link
                        to={dashboardHref || '/register'}
                        className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 hover:scale-105"
                    >
                        {dashboardHref ? 'Go to dashboard' : 'Get started free'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400">
                    {['No credit card required', 'Free tier for small universities', 'Set up in under 10 minutes'].map(
                        (item) => (
                            <span key={item} className="inline-flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                                {item}
                            </span>
                        ),
                    )}
                </div>
            </div>
        </section>
    )
}