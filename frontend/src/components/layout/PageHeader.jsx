import { motion } from 'framer-motion'
import { fadeUp } from '../../lib/motion'

export default function PageHeader({ title, description, action }) {
    return (
        <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </motion.div>
    )
}