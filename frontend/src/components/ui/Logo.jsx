/**
 * UniQueue brand logo.
 *
 * Usage:
 *   <Logo size={32} />                  // icon-only at small sizes
 *   <Logo size={120} variant="full" />  // full lockup with wordmark
 *
 * The logo image contains both the arrow icon AND the "Uniqueue"
 * wordmark. Below ~64px the wordmark becomes unreadable, so use the
 * `iconOnly` prop (or a separately cropped icon file) for tiny sizes.
 */
export default function Logo({
                                 size = 40,
                                 variant = 'icon',   // 'icon' | 'full'
                                 alt = 'UniQueue',
                                 className = '',
                                 ...rest
                             }) {
    const src =
        variant === 'full'
            ? '/uniqueue-logo.png'
            : '/uniqueue-icon.png'  // fall back to full if icon doesn't exist

    return (
        <img
            src={src}
            alt={alt}
            width={size}
            height={size}
            draggable={false}
            className={`select-none object-contain ${className}`}
            onError={(e) => {
                // Graceful fallback — if /uniqueue-icon.png is missing, use the full
                if (variant === 'icon' && !e.target.dataset.fallback) {
                    e.target.dataset.fallback = '1'
                    e.target.src = '/uniqueue-logo.png'
                }
            }}
            {...rest}
        />
    )
}