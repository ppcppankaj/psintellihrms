
import { Fragment, useState, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CloudArrowUpIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'

interface BulkUploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload: (file: File) => Promise<any>
    onDownloadTemplate: () => void
    title?: string
}

interface ValidationError {
    row: number
    error: any
}

export default function BulkUploadModal({
    isOpen,
    onClose,
    onUpload,
    onDownloadTemplate,
    title = 'Bulk Upload'
}: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadErrors, setUploadErrors] = useState<ValidationError[]>([])
    const [successCount, setSuccessCount] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setUploadErrors([])
            setSuccessCount(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setIsUploading(true)
        setUploadErrors([])
        setSuccessCount(null)

        try {
            const response = await onUpload(file)

            if (response.errors && response.errors.length > 0) {
                setUploadErrors(response.errors)
            }

            if (response.success_count !== undefined) {
                setSuccessCount(response.success_count)
            } else {
                // Assuming simple success if no count returned
                setSuccessCount(0)
            }
        } catch (error) {
            console.error('Upload failed', error)
        } finally {
            setIsUploading(false)
        }
    }

    const reset = () => {
        setFile(null)
        setUploadErrors([])
        setSuccessCount(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-surface-800 p-6 text-left align-middle shadow-xl transition-all border border-surface-200 dark:border-surface-700">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-surface-900 dark:text-white">
                                        {title}
                                    </Dialog.Title>
                                    <button onClick={handleClose} className="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-surface-50 dark:bg-surface-900/50 p-4 rounded-lg">
                                        <div className="text-sm text-surface-600 dark:text-surface-300">
                                            <p className="font-medium">Step 1: Download Template</p>
                                            <p>Use this template to format your data correctly.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onDownloadTemplate}
                                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition"
                                        >
                                            <DocumentArrowDownIcon className="w-4 h-4" />
                                            Download Template
                                        </button>
                                    </div>

                                    <div className="bg-surface-50 dark:bg-surface-900/50 p-4 rounded-lg">
                                        <p className="font-medium text-sm text-surface-600 dark:text-surface-300 mb-2">Step 2: Upload File</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept=".csv, .xlsx, .xls"
                                            className="block w-full text-sm text-surface-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-primary-50 file:text-primary-700
                                                hover:file:bg-primary-100"
                                        />
                                        <p className="mt-2 text-xs text-surface-500">Supported formats: .csv, .xlsx</p>
                                    </div>

                                    {successCount !== null && (
                                        <div className={`p-4 rounded-lg ${uploadErrors.length > 0 ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'}`}>
                                            <p className="font-medium">
                                                {uploadErrors.length > 0
                                                    ? `Partial success: ${successCount} rows imported, ${uploadErrors.length} failed.`
                                                    : `Success! ${successCount} rows imported successfully.`
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {uploadErrors.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Validation Errors</h4>
                                            <div className="max-h-60 overflow-y-auto border border-red-200 dark:border-red-900/50 rounded-lg">
                                                <table className="min-w-full divide-y divide-red-200 dark:divide-red-900/50">
                                                    <thead className="bg-red-50 dark:bg-red-900/20">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-red-700 dark:text-red-300 uppercase">Row</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-red-700 dark:text-red-300 uppercase">Error</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-red-100 dark:divide-red-900/30">
                                                        {uploadErrors.map((err, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-3 py-2 text-sm text-surface-700 dark:text-surface-300 whitespace-nowrap">{err.row}</td>
                                                                <td className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                                                                    {typeof err.error === 'object'
                                                                        ? Object.entries(err.error).map(([k, v]) => `${k}: ${v}`).join(', ')
                                                                        : String(err.error)
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-lg hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-600 dark:hover:bg-surface-700"
                                            disabled={isUploading}
                                        >
                                            {successCount !== null && uploadErrors.length === 0 ? 'Close' : 'Cancel'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={!file || isUploading}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? <LoadingSpinner size="sm" className="text-white" /> : <CloudArrowUpIcon className="w-4 h-4" />}
                                            {isUploading ? 'Uploading...' : 'Upload'}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
