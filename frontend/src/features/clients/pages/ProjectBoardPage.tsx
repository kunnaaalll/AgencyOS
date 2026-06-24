import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
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
import { useDemoQuery } from '@/lib/useDemoQuery';
import { mockTasksData } from '@/mocks';

interface SortableTaskProps {
  task: Task;
}

function SortableTask({ task }: SortableTaskProps) {
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
      className="p-4 bg-white border border-surface-200 shadow-sm rounded-lg cursor-grab active:cursor-grabbing mb-3"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-surface-900 text-sm">{task.title}</h4>
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

function BoardColumn({ id, title, tasks }: { id: string, title: string, tasks: Task[] }) {
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
            <SortableTask key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function ProjectBoardPage() {
  const { id } = useParams({ strict: false });
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useDemoQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => clientsApi.getTasks(id as string),
    enabled: !!id,
  }, mockTasksData);

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

  if (isLoading) return <div className="p-8">Loading board...</div>;

  const todoTasks = tasks?.filter((t: Task) => t.status === TaskStatus.TODO) || [];
  const inProgressTasks = tasks?.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS) || [];
  const reviewTasks = tasks?.filter((t: Task) => t.status === TaskStatus.REVIEW) || [];
  const doneTasks = tasks?.filter((t: Task) => t.status === TaskStatus.DONE) || [];

  return (
    <div className="max-w-[1600px] mx-auto p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-surface-900">Project Board</h2>
        <p className="text-surface-500 mt-0.5 text-sm">Manage tasks for this project</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full items-start">
            <BoardColumn id={TaskStatus.TODO} title="To Do" tasks={todoTasks} />
            <BoardColumn id={TaskStatus.IN_PROGRESS} title="In Progress" tasks={inProgressTasks} />
            <BoardColumn id={TaskStatus.REVIEW} title="Review" tasks={reviewTasks} />
            <BoardColumn id={TaskStatus.DONE} title="Done" tasks={doneTasks} />
          </div>
        </DndContext>
      </div>
    </div>
  );
}
