import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clientsApi } from '../api';
import { Task, TaskStatus } from '../types';

interface SortableTaskProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableTask({ task, onEdit, onDelete }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-green-100 text-green-700',
    URGENT: 'bg-purple-100 text-purple-700',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 bg-white border border-surface-200 shadow-sm rounded-lg cursor-grab active:cursor-grabbing mb-3 group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-surface-900 text-sm">{task.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-[var(--color-muted)] hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-surface-500 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority] || 'bg-surface-100 text-surface-700'}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className="text-[10px] text-surface-400">
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

function BoardColumn({ id, title, tasks, onEdit, onDelete }: { id: string, title: string, tasks: Task[], onEdit: (t: Task) => void, onDelete: (id: string) => void }) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div className="bg-surface-50 flex flex-col rounded-xl border border-surface-200 min-h-[500px] w-80 shrink-0">
      <div className="p-4 border-b border-surface-200">
        <h3 className="font-semibold text-surface-700">{title} <span className="ml-2 text-surface-400 text-sm font-normal">{tasks.length}</span></h3>
      </div>
      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function ProjectBoardPage() {
  const { id } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => clientsApi.getTasks(id as string),
    enabled: !!id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string, status: TaskStatus }) =>
      clientsApi.updateTask(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['project-tasks', id] });
      const previousTasks = queryClient.getQueryData<Task[]>(['project-tasks', id]);
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['project-tasks', id], old => 
          old?.map((t: Task) => t.id === taskId ? { ...t, status } : t)
        );
      }
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['project-tasks', id], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
    },
  });

  const sensors = useSensors(
    usePointerSensor(),
    useKeyboardSensor()
  );

  function usePointerSensor() {
    return useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    });
  }

  function useKeyboardSensor() {
    return useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Is it dropped over a column directly?
    const columns = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE];
    if (columns.includes(overId as TaskStatus)) {
      const activeTask = tasks?.find((t: Task) => t.id === activeId);
      if (activeTask && activeTask.status !== overId) {
        updateTaskMutation.mutate({ taskId: activeId, status: overId as TaskStatus });
      }
      return;
    }

    // Is it dropped over another task?
    const overTask = tasks?.find((t: Task) => t.id === overId);
    if (overTask) {
      const activeTask = tasks?.find((t: Task) => t.id === activeId);
      if (activeTask && activeTask.status !== overTask.status) {
        updateTaskMutation.mutate({ taskId: activeId, status: overTask.status });
      }
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await clientsApi.deleteTask(taskId);
      queryClient.setQueryData(['project-tasks', id], (oldData: Task[] | undefined) => {
        return oldData?.filter(t => t.id !== taskId) || [];
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert((error as any)?.response?.data?.detail || (error as any)?.message || 'An error occurred. Please try again.');
      alert('Failed to delete task');
    }
  };

  if (isLoading) return <div className="p-8">Loading board...</div>;

  const todoTasks = tasks?.filter((t: Task) => t.status === TaskStatus.TODO) || [];
  const inProgressTasks = tasks?.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS) || [];
  const reviewTasks = tasks?.filter((t: Task) => t.status === TaskStatus.REVIEW) || [];
  const doneTasks = tasks?.filter((t: Task) => t.status === TaskStatus.DONE) || [];

  return (
    <div className="max-w-[1600px] mx-auto p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Project Board</h2>
          <p className="text-surface-500 mt-0.5 text-sm">Manage tasks for this project</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full items-start">
            <BoardColumn id={TaskStatus.TODO} title="To Do" tasks={todoTasks} onEdit={setEditingTask} onDelete={handleDelete} />
            <BoardColumn id={TaskStatus.IN_PROGRESS} title="In Progress" tasks={inProgressTasks} onEdit={setEditingTask} onDelete={handleDelete} />
            <BoardColumn id={TaskStatus.REVIEW} title="Review" tasks={reviewTasks} onEdit={setEditingTask} onDelete={handleDelete} />
            <BoardColumn id={TaskStatus.DONE} title="Done" tasks={doneTasks} onEdit={setEditingTask} onDelete={handleDelete} />
          </div>
        </DndContext>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          const newTask = await clientsApi.createTask(id as string, {
            ...data,
            project_id: id as string,
          });
          queryClient.setQueryData(['project-tasks', id], (oldData: any) => {
            return [...(oldData || []), newTask];
          });
        }}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSubmit={async (taskId, data) => {
          const updatedTask = await clientsApi.updateTask(taskId, data);
          queryClient.setQueryData(['project-tasks', id], (oldData: Task[] | undefined) => {
            return oldData?.map(t => t.id === taskId ? updatedTask : t) || [];
          });
        }}
      />
    </div>
  );
}
