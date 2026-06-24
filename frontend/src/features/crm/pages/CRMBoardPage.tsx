import React, { useState, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import { crmStore, updateOpportunityStageLocal } from '@/store/crmStore';
import { AppSkeleton } from '@/components/layout/AppSkeleton';
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
import { DEMO_MODE } from '@/config/demo';
import { mockOpportunities } from '@/mocks';


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

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="bg-[var(--color-surface-card)] p-4 mb-3 rounded-xl shadow-sm border border-[var(--color-hairline)] cursor-grab active:cursor-grabbing hover:border-[var(--color-primary)] transition-colors">
      <h4 className="text-claude-body-md font-semibold text-[var(--color-ink)] mb-1">{opportunity.title}</h4>
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

function SortableItem({ id, opportunity }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OpportunityCard opportunity={opportunity} />
    </div>
  );
}

function DroppableColumn({ id, stage, columnOpps }: { id: PipelineStage, stage: string, columnOpps: Opportunity[] }) {
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
              <SortableItem key={opp.id} id={opp.id} opportunity={opp} />
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
  const { opportunities } = useStore(crmStore);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }
    try {
      const data = await crmApi.getOpportunities();
      // In a real app we'd dispatch data to store
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

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
      // Optimistic update
      const prevStage = activeOpportunity.pipeline_stage;
      updateOpportunityStageLocal(activeId, targetStage as PipelineStage);

      try {
        if (!DEMO_MODE) {
          await crmApi.updateOpportunity(activeId, { pipeline_stage: targetStage });
        }
      } catch (error) {
        console.error('Failed to update stage:', error);
        if (!DEMO_MODE) {
          // Revert optimistic update only if NOT in demo mode
          updateOpportunityStageLocal(activeId, prevStage);
        }
      }
    }
  };

  if (loading) {
    return <AppSkeleton />;
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-claude-display-lg text-[var(--color-ink)]">Pipeline Board</h1>
        <p className="text-[var(--color-muted)] text-claude-body-md mt-2">Drag and drop opportunities to update their stage.</p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {STAGES.map(stage => {
            const columnOpps = opportunities.filter(o => o.pipeline_stage === stage);
            
            return (
              <DroppableColumn key={stage} id={stage} stage={stage} columnOpps={columnOpps} />
            );
          })}
          <DragOverlay>
            {activeId ? (
              <OpportunityCard opportunity={opportunities.find(o => o.id === activeId)!} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
