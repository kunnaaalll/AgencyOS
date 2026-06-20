import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import { format } from 'date-fns';

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

function SortableItem({ id, opportunity }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 mb-3 rounded-lg shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:border-blue-300"
    >
      <h4 className="font-medium text-gray-900 mb-1">{opportunity.title}</h4>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
        <span>${opportunity.value.toLocaleString()}</span>
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
          {opportunity.probability}%
        </span>
      </div>
      {opportunity.expected_close_date && (
        <div className="text-xs text-gray-400">
          Closes: {format(new Date(opportunity.expected_close_date), 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
}

export function CRMBoardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await crmApi.getOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
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
      setOpportunities(prevs => 
        prevs.map(opp => 
          opp.id === activeId 
            ? { ...opp, pipeline_stage: targetStage as PipelineStage } 
            : opp
        )
      );

      try {
        await crmApi.updateOpportunity(activeId, { pipeline_stage: targetStage });
        // Reload to get updated probability
        loadData();
      } catch (error) {
        console.error('Failed to update stage:', error);
        // Revert optimistic update
        setOpportunities(prevs => 
          prevs.map(opp => 
            opp.id === activeId 
              ? { ...opp, pipeline_stage: prevStage } 
              : opp
          )
        );
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline Board</h1>
        <p className="text-gray-500">Drag and drop opportunities to update their stage.</p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {STAGES.map(stage => {
            const columnOpps = opportunities.filter(o => o.pipeline_stage === stage);
            
            return (
              <div key={stage} className="bg-gray-50 rounded-xl p-4 w-80 shrink-0 flex flex-col max-h-full">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-semibold text-gray-700">{stage}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                    {columnOpps.length}
                  </span>
                </div>

                {/* Provide a drop target for the column itself */}
                <div id={stage} className="flex-1 overflow-y-auto">
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
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm">
                          Drop here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </DndContext>
      </div>
    </div>
  );
}
