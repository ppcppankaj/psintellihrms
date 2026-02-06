/**
 * Applications Page - Kanban Board
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recruitmentService, JobApplication } from '@/services/recruitmentService'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const STAGES = [
    { id: 'new', label: 'New' },
    { id: 'screening', label: 'Screening' },
    { id: 'interview', label: 'Interview' },
    { id: 'technical', label: 'Technical' },
    { id: 'hr', label: 'HR Round' },
    { id: 'offer', label: 'Offer' },
    { id: 'hired', label: 'Hired' },
    { id: 'rejected', label: 'Rejected' },
] as const

type StageId = typeof STAGES[number]['id']

export default function ApplicationsPage() {
    const queryClient = useQueryClient()

    const { data: applications = [], isLoading } = useQuery({
        queryKey: ['applications'],
        queryFn: recruitmentService.getApplications,
    })

    const updateStageMutation = useMutation({
        mutationFn: ({ id, stage }: { id: string; stage: StageId }) =>
            recruitmentService.updateApplicationStage(id, stage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
            toast.success('Stage updated')
        },
        onError: () => {
            toast.error('Failed to update stage')
        },
    })

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const newStage = destination.droppableId as StageId

        updateStageMutation.mutate({
            id: draggableId,
            stage: newStage,
        })
    }

    if (isLoading) return <LoadingSpinner />

    // Group applications by stage
    const columns: Record<StageId, JobApplication[]> = STAGES.reduce((acc, stage) => {
        acc[stage.id] = applications.filter(app => app.stage === stage.id)
        return acc
    }, {} as Record<StageId, JobApplication[]>)

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">
                Applications Kanban
            </h1>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex overflow-x-auto pb-4 gap-4 h-full">
                    {STAGES.map(stage => (
                        <div
                            key={stage.id}
                            className="min-w-[280px] w-[280px] flex flex-col bg-surface-50 dark:bg-surface-800 rounded-lg p-3"
                        >
                            <h3 className="font-semibold text-surface-700 dark:text-surface-300 mb-3 flex justify-between">
                                {stage.label}
                                <span className="bg-surface-200 dark:bg-surface-700 px-2 rounded-full text-xs py-1">
                                    {columns[stage.id]?.length || 0}
                                </span>
                            </h3>

                            <Droppable droppableId={stage.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex-1 overflow-y-auto space-y-3 min-h-[100px]"
                                    >
                                        {columns[stage.id].map((app, index) => (
                                            <Draggable
                                                key={app.id}
                                                draggableId={app.id}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <Card className="shadow-sm hover:shadow-md cursor-grab">
                                                            <div className="p-3">
                                                                <p className="font-bold text-sm">
                                                                    {app.candidate_details?.first_name}{' '}
                                                                    {app.candidate_details?.last_name}
                                                                </p>
                                                                <p className="text-xs text-surface-500">
                                                                    {app.job_details?.title}
                                                                </p>

                                                                {typeof app.ai_score === 'number' && (
                                                                    <div className="mt-2 flex items-center">
                                                                        <span
                                                                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${app.ai_score > 80
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : app.ai_score > 50
                                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                                        : 'bg-red-100 text-red-800'
                                                                                }`}
                                                                        >
                                                                            AI: {app.ai_score}%
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    )
}
