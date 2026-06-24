import { Task, TaskStatus, TaskPriority } from '../features/clients/types';

export const mockTasksData: Task[] = [
  {
    id: 'task-1',
    project_id: '1',
    title: 'Setup Google Analytics 4',
    description: 'Configure GA4 properties and set up conversion tracking for the main website.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    due_date: '2024-06-25T00:00:00Z',
    created_at: '2024-06-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  },
  {
    id: 'task-2',
    project_id: '1',
    title: 'Content Strategy Review',
    description: 'Review the Q3 content strategy with the client marketing team.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    due_date: '2024-06-24T00:00:00Z',
    created_at: '2024-06-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  },
  {
    id: 'task-3',
    project_id: '1',
    title: 'Draft landing page copy',
    description: 'Write copy for the new SaaS product landing page.',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.HIGH,
    due_date: '2024-06-23T00:00:00Z',
    created_at: '2024-06-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  },
  {
    id: 'task-4',
    project_id: '1',
    title: 'Onboarding Call',
    description: 'Initial kickoff call with the stakeholders.',
    status: TaskStatus.DONE,
    priority: TaskPriority.URGENT,
    due_date: '2024-06-20T00:00:00Z',
    created_at: '2024-06-19T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  }
];