import { motion } from 'framer-motion'

export default function Card({
                                 children,
                                 className = '',
                                 padded = true,
                                 hover = false,
                                 animate = false,
                                 delay = 0,
                             }) {
    const Comp = animate ? motion.div : 'div'
    const motionProps = animate
        ? {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] },
            whileHover: hover ? { y: -3, boxShadow: '0 10px 30px -12px rgba(15,23,42,0.15)' } : {},
        }
        : hover
            ? {
                whileHover: { y: -3, boxShadow: '0 10px 30px -12px rgba(15,23,42,0.15)' },
                transition: { duration: 0.2 },
            }
            : {}

    return (
        <Comp
            {...motionProps}
            className={`rounded-xl border border-slate-200 bg-white shadow-sm ${
                padded ? 'p-6' : ''
            } ${className}`}
        >
            {children}
        </Comp>
    )
}