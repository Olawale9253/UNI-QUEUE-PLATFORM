import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    UploadCloud,
    Link as LinkIcon,
    X as CloseIcon,
    Loader2,
    AlertCircle,
} from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

export default function FileUpload({
                                       label,
                                       value,
                                       onChange,
                                       accept = 'image/jpeg,image/png,image/jpg,image/webp',
                                       hint,
                                       previewHeight = 'h-40',
                                   }) {
    const storedOnServer = value?.startsWith('/api/files/')
    const [mode, setMode] = useState(storedOnServer || !value ? 'upload' : 'url')
    const [uploading, setUploading] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [urlInput, setUrlInput] = useState(
        value && !storedOnServer ? value : ''
    )
    const [previewError, setPreviewError] = useState(false)
    const inputRef = useRef(null)
    const { push } = useToastStore()

    const uploadFile = useCallback(
        async (file) => {
            if (!file) return
            if (file.size > 5 * 1024 * 1024) {
                push({ type: 'error', message: 'File too large. Max 5MB.' })
                return
            }
            setUploading(true)
            setPreviewError(false)
            try {
                const form = new FormData()
                form.append('file', file)
                const res = await api.post('/api/files/upload', form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                const url = res.data?.data?.url
                if (url) {
                    onChange(url)
                } else {
                    push({ type: 'error', message: 'Upload failed — no URL returned' })
                }
            } catch (err) {
                push({
                    type: 'error',
                    message: err.response?.data?.message || 'Upload failed',
                })
            } finally {
                setUploading(false)
            }
        },
        [onChange, push]
    )

    const handleDrop = (event) => {
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (file) uploadFile(file)
    }

    const handleFilePick = (eventValue) => {
        const file = eventValue.target.files?.[0]
        if (file) uploadFile(file)
    }

    const clear = () => {
        onChange(null)
        setUrlInput('')
        setPreviewError(false)
        if (inputRef.current) inputRef.current.value = ''
    }

    const applyUrl = () => {
        const trimmed = urlInput.trim()
        if (!trimmed) return
        setPreviewError(false)
        onChange(trimmed)
    }

    const hasValue = !!value

    return (
        <div>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}

            {/* Mode toggle */}
            <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        mode === 'upload'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                >
                    <UploadCloud className="h-3 w-3" />
                    Upload
                </button>
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        mode === 'url'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                >
                    <LinkIcon className="h-3 w-3" />
                    Paste URL
                </button>
            </div>

            {/* Upload mode — drop zone */}
            {mode === 'upload' && !hasValue && (
                <div
                    onDragOver={(eventValue2) => {
                        eventValue2.preventDefault()
                        setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                        dragging
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Uploading…
                            </p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="h-6 w-6 text-slate-400" />
                            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                Click to upload or drag & drop
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                JPG, PNG or WebP · Max 5MB
                            </p>
                        </>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFilePick}
                        className="hidden"
                        disabled={uploading}
                    />
                </div>
            )}

            {/* URL mode — text input */}
            {mode === 'url' && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={urlInput}
                            onChange={(eventValue3) => setUrlInput(eventValue3.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                        <button
                            type="button"
                            onClick={applyUrl}
                            disabled={!urlInput.trim()}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                            Use URL
                        </button>
                    </div>
                </div>
            )}

            {/* Preview */}
            {hasValue && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                >
                    <div className={`flex ${previewHeight} items-center justify-center p-2`}>
                        {previewError ? (
                            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                                <AlertCircle className="mx-auto mb-1 h-5 w-5 text-rose-500" />
                                Couldn't load preview
                            </div>
                        ) : (
                            <img
                                src={value}
                                alt="Preview"
                                onError={() => setPreviewError(true)}
                                className="max-h-full max-w-full object-contain"
                            />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-2 top-2 rounded-md bg-slate-900/80 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-rose-600"
                        aria-label="Remove image"
                    >
                        <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                </motion.div>
            )}

            {hint && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
            )}
        </div>
    )
}