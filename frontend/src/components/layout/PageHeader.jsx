import { motion } from 'framer-motion'
import { fadeUp } from '../../lib/motion'

export default function PageHeader({ title, description, action }) {
    return (
        <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">{description}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </motion.div>
    )
}