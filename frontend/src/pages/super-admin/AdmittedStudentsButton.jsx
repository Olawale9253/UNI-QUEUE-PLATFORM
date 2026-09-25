import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Upload } from 'lucide-react'
import AdmittedStudentsModal from './AdmittedStudentsModal'

export default function AdmittedStudentsButton({ university }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 transition-colors hover:text-violet-700"
            >
                <Upload className="h-3.5 w-3.5" />
                Admission list
            </button>
            <AnimatePresence>
                {open && <AdmittedStudentsModal university={university} onClose={() => setOpen(false)} />}
            </AnimatePresence>
        </>
    )
}