// Shared animation variants — used across the app.
// Keeping them central makes it easy to tune the whole app's feel.

export const ease = [0.16, 1, 0.3, 1] // ease-out-expo — smooth, modern

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.35, ease } },
    exit: { opacity: 0, transition: { duration: 0.2, ease } },
}

export const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease } },
}

export const fadeUpFast = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
}

export const scaleIn = {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease } },
    exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
}

// Parent that staggers its children.
export const stagger = (delayChildren = 0.05, staggerChildren = 0.06) => ({
    initial: {},
    animate: {
        transition: { delayChildren, staggerChildren },
    },
})

export const staggerItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

// For expandable panels
export const expand = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease } },
}

// For the toast stack
export const toastSlide = {
    initial: { opacity: 0, x: 40, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.28, ease } },
    exit: { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.18 } },
}