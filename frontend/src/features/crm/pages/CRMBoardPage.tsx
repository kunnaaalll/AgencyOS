import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { AppSkeleton } from '@/components/layout/AppSkeleton';
import { AddOpportunityModal } from '../components/AddOpportunityModal';
import { EditOpportunityModal } from '../components/EditOpportunityModal';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PipelineStage, Opportunity } from '../types';
import { crmApi } from '../api';


const STAGES = [
  PipelineStage.NEW,
  PipelineStage.QUALIFIED,
  PipelineStage.CONTACTED,
  PipelineStage.MEETING,
  PipelineStage.PROPOSAL,
  PipelineStage.WON,
  PipelineStage.LOST,
];

interface SortableItemProps {
  id: string;
  opportunity: Opportunity;
}

function OpportunityCard({ opportunity, onEdit, onDelete }: { opportunity: Opportunity, onEdit: () => void, onDelete: () => void }) {
  return (
    <div className="bg-[var(--color-surface-card)] p-4 mb-3 rounded-xl shadow-sm border border-[var(--color-hairline)] cursor-grab active:cursor-grabbing hover:border-[var(--color-primary)] transition-colors group">
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-claude-body-md font-semibold text-[var(--color-ink)]">{opportunity.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-[var(--color-muted)] hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center text-claude-body-sm text-[var(--color-muted)] mb-2">
        <span>₹{opportunity.value.toLocaleString()}</span>
        <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
          {opportunity.probability}%
        </span>
      </div>
      {opportunity.expected_close_date && (
        <div className="text-xs text-[var(--color-muted)] opacity-70">
          Closes: {new Date(opportunity.expected_close_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function SortableItem({ id, opportunity, onEdit, onDelete }: SortableItemProps & { onEdit: () => void, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OpportunityCard opportunity={opportunity} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function DroppableColumn({ id, stage, columnOpps, onEdit, onDelete }: { id: PipelineStage, stage: string, columnOpps: Opportunity[], onEdit: (opp: Opportunity) => void, onDelete: (id: string) => void }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="bg-[var(--color-surface-soft)] rounded-xl p-4 w-80 shrink-0 flex flex-col max-h-full border border-[var(--color-hairline)]">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-claude-body-md font-semibold text-[var(--color-ink)] tracking-wide uppercase">{stage}</h3>
        <span className="bg-[var(--color-surface-card)] text-[var(--color-ink)] text-xs font-bold px-2.5 py-1 rounded-full border border-[var(--color-hairline)]">
          {columnOpps.length}
        </span>
      </div>

      <div ref={setNodeRef} id={stage} className="flex-1 overflow-y-auto">
        <SortableContext
          id={stage}
          items={columnOpps.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[150px]">
            {columnOpps.map(opp => (
              <SortableItem key={opp.id} id={opp.id} opportunity={opp} onEdit={() => onEdit(opp)} onDelete={() => onDelete(opp.id)} />
            ))}
            {columnOpps.length === 0 && (
              <div className="border-2 border-dashed border-[var(--color-hairline)] rounded-xl p-4 text-center text-[var(--color-muted)] text-claude-body-sm">
                Drop here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function CRMBoardPage() {
  const queryClient = useQueryClient();
  const { data: rawOpportunities = [], isLoading: loading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: crmApi.getOpportunities,
  });
  const opportunities: Opportunity[] = Array.isArray(rawOpportunities)
    ? (rawOpportunities as Opportunity[])
    : Array.isArray((rawOpportunities as any)?.items)
    ? (rawOpportunities as any).items
    : [];

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) => 
      crmApi.updateOpportunity(id, { pipeline_stage: stage }),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });
      const previousOpps = queryClient.getQueryData<Opportunity[]>(['opportunities']);
      if (previousOpps) {
        queryClient.setQueryData<Opportunity[]>(['opportunities'], (old: any) => 
          (old || []).map((o: any) => o.id === id ? { ...o, pipeline_stage: stage } : o)
        );
      }
      return { previousOpps };
    },
    onError: (err, variables, context) => {
      if (context?.previousOpps) {
        queryClient.setQueryData(['opportunities'], context.previousOpps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: crmApi.deleteOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    }
  });

  const createMutation = useMutation({
    mutationFn: crmApi.createOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Opportunity> }) => crmApi.updateOpportunity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setEditingOpportunity(null);
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging over a different stage column or an item in it
    let targetStage: PipelineStage | null = null;
    
    if (STAGES.includes(overId as PipelineStage)) {
      targetStage = overId as PipelineStage;
    } else {
      const overOpportunity = opportunities.find(o => o.id === overId);
      if (overOpportunity) {
        targetStage = overOpportunity.pipeline_stage;
      }
    }

    if (!targetStage) return;

    const activeOpportunity = opportunities.find(o => o.id === activeId);
    if (!activeOpportunity) return;

    if (activeOpportunity.pipeline_stage !== targetStage) {
      updateStageMutation.mutate({ id: activeId, stage: targetStage as PipelineStage });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    deleteMutation.mutate(id);
  };

  if (loading) {
    return <AppSkeleton />;
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-claude-display-lg text-[var(--color-ink)]">Pipeline Board</h1>
          <p className="text-[var(--color-muted)] text-claude-body-md mt-2">Drag and drop opportunities to update their stage.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-claude-body-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Opportunity
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {STAGES.map(stage => {
            const columnOpps = opportunities.filter(o => o.pipeline_stage === stage);
            
            return (
              <DroppableColumn 
                key={stage} 
                id={stage} 
                stage={stage} 
                columnOpps={columnOpps} 
                onEdit={(opp) => setEditingOpportunity(opp)}
                onDelete={handleDelete}
              />
            );
          })}
          <DragOverlay>
            {activeId ? (
              <OpportunityCard 
                opportunity={opportunities.find(o => o.id === activeId)!} 
                onEdit={() => {}} 
                onDelete={() => {}} 
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AddOpportunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          createMutation.mutate(data);
        }}
      />

      <EditOpportunityModal
        isOpen={!!editingOpportunity}
        onClose={() => setEditingOpportunity(null)}
        opportunity={editingOpportunity}
        onSubmit={async (id, data) => {
          updateMutation.mutate({ id, data });
        }}
      />
    </div>
  );
}
