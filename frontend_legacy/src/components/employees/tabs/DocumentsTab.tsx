/**
 * DocumentsTab - Employee documents management
 */

import { useState } from 'react'
import { useEmployeeStore } from '@/store/employeeStore'
import { useAuthStore } from '@/store/authStore'
import { employeeService } from '@/services/employeeService'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface DocumentsTabProps {
    employeeId: string
}

export default function DocumentsTab({ employeeId }: DocumentsTabProps) {
    const { documents, isLoadingRelated, fetchDocuments } = useEmployeeStore()
    const hasPermission = useAuthStore((state) => state.hasPermission)
    const canUpload = hasPermission('employees.upload_documents')

    const [isUploading, setIsUploading] = useState(false)
    const [uploadType, setUploadType] = useState('other')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            await employeeService.uploadDocument(employeeId, file, uploadType)
            await fetchDocuments(employeeId)
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setIsUploading(false)
        }
    }

    if (isLoadingRelated) {
        return <DocumentsSkeleton />
    }

    return (
        <Card>
            <CardHeader
                title="Documents"
                subtitle="Employee documents and certificates"
                action={
                    canUpload && (
                        <div className="flex items-center gap-2">
                            <select
                                value={uploadType}
                                onChange={(e) => setUploadType(e.target.value)}
                                className="text-sm px-2 py-1 rounded border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                            >
                                <option value="resume">Resume</option>
                                <option value="offer_letter">Offer Letter</option>
                                <option value="id_proof">ID Proof</option>
                                <option value="address_proof">Address Proof</option>
                                <option value="education">Education</option>
                                <option value="experience">Experience Letter</option>
                                <option value="other">Other</option>
                            </select>
                            <label className="cursor-pointer px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                                {isUploading ? 'Uploading...' : 'Upload'}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                            </label>
                        </div>
                    )
                }
            />
            <CardContent>
                {!Array.isArray(documents) || documents.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="divide-y divide-surface-200 dark:divide-surface-700">
                        {documents.map((doc) => (
                            <div key={doc.id} className="py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
                                        <FileIcon />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                                            {doc.name}
                                        </p>
                                        <p className="text-xs text-surface-500">
                                            {formatDocType(doc.document_type)} · {formatBytes(doc.file_size)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {doc.is_verified ? (
                                        <Badge variant="success" size="sm">Verified</Badge>
                                    ) : (
                                        <Badge variant="warning" size="sm">Pending</Badge>
                                    )}
                                    {doc.expiry_date && (
                                        <span className="text-xs text-surface-500">
                                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                        </span>
                                    )}
                                    <a
                                        href={doc.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 text-sm"
                                    >
                                        View
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-8">
            <FileIcon className="mx-auto h-12 w-12 text-surface-400" />
            <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No documents</h3>
            <p className="mt-1 text-sm text-surface-500">Upload documents to get started.</p>
        </div>
    )
}

function DocumentsSkeleton() {
    return (
        <Card>
            <div className="animate-pulse p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-surface-100 dark:bg-surface-700 rounded" />
                ))}
            </div>
        </Card>
    )
}

function FileIcon({ className = 'w-5 h-5' }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    )
}

function formatDocType(type: string): string {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
