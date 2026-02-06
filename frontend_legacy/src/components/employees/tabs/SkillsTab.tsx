import { useState, useEffect } from 'react'
import { useEmployeeStore } from '@/store/employeeStore'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SkillsTabProps {
    employeeId: string
}

const proficiencyColors = {
    beginner: 'default',
    intermediate: 'info',
    advanced: 'primary',
    expert: 'success',
} as const

const proficiencyWidth = {
    beginner: 'w-1/4',
    intermediate: 'w-1/2',
    advanced: 'w-3/4',
    expert: 'w-full',
}

export default function SkillsTab({ employeeId }: SkillsTabProps) {
    const { skills, isLoadingRelated, availableSkills, fetchAvailableSkills, addSkill } = useEmployeeStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        skill_id: '',
        proficiency: 'intermediate',
        years_of_experience: 0
    })

    useEffect(() => {
        fetchAvailableSkills()
    }, [fetchAvailableSkills])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.skill_id) return

        setIsSubmitting(true)
        try {
            await addSkill(employeeId, formData)
            setIsModalOpen(false)
            setFormData({
                skill_id: '',
                proficiency: 'intermediate',
                years_of_experience: 0
            })
        } catch (error) {
            console.error('Failed to add skill:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingRelated) {
        return <SkillsSkeleton />
    }

    // Group by category
    const groupedSkills = skills.reduce((acc, skill) => {
        const category = skill.skill.category || 'Other'
        if (!acc[category]) acc[category] = []
        acc[category].push(skill)
        return acc
    }, {} as Record<string, typeof skills>)

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Skill</span>
                </button>
            </div>

            {Object.keys(groupedSkills).length === 0 ? (
                <EmptyState />
            ) : (
                Object.entries(groupedSkills).map(([category, categorySkills]) => (
                    <Card key={category}>
                        <CardHeader title={category} />
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categorySkills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-surface-900 dark:text-white">
                                                    {skill.skill.name}
                                                </span>
                                                {skill.is_verified && (
                                                    <VerifiedIcon />
                                                )}
                                            </div>
                                            <Badge
                                                variant={proficiencyColors[skill.proficiency]}
                                                size="sm"
                                            >
                                                {capitalize(skill.proficiency)}
                                            </Badge>
                                        </div>

                                        {/* Proficiency bar */}
                                        <div className="h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-primary-500 rounded-full transition-all ${proficiencyWidth[skill.proficiency]}`}
                                            />
                                        </div>

                                        {skill.years_of_experience && (
                                            <p className="mt-2 text-xs text-surface-500">
                                                {skill.years_of_experience} years experience
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}

            {/* Add Skill Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                            <h3 className="text-xl font-semibold text-surface-900 dark:text-white">Add New Skill</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Select Skill
                                </label>
                                <select
                                    required
                                    value={formData.skill_id}
                                    onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                                    className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="">Select a skill</option>
                                    {availableSkills.map((skill) => (
                                        <option key={skill.id} value={skill.id}>
                                            {skill.name} ({skill.category})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Proficiency
                                </label>
                                <select
                                    value={formData.proficiency}
                                    onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as any })}
                                    className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Years of Experience
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.years_of_experience}
                                    onChange={(e) => setFormData({ ...formData, years_of_experience: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.skill_id}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Skill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptyState() {
    return (
        <Card>
            <CardContent className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No skills added</h3>
                <p className="mt-1 text-sm text-surface-500">Skills will appear here once added.</p>
            </CardContent>
        </Card>
    )
}

function SkillsSkeleton() {
    return (
        <Card>
            <div className="animate-pulse p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-surface-100 dark:bg-surface-700 rounded" />
                ))}
            </div>
        </Card>
    )
}

function VerifiedIcon() {
    return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    )
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
