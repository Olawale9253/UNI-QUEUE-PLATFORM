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
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </motion.div>
    )
}