import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { TaskStatus, TaskPriority, Task } from '../types';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSubmit: (id: string, data: Partial<Task>) => Promise<void>;
}

export function EditTaskModal({ isOpen, onClose, task, onSubmit }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(
        task.due_date 
          ? new Date(task.due_date).toISOString().split('T')[0] 
          : ''
      );
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(task.id, {
        title,
        description: description || undefined,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert((error as any)?.response?.data?.detail || (error as any)?.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface-card)] rounded-2xl shadow-xl border border-[var(--color-hairline)] z-50 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-claude-heading text-[var(--color-ink)]">
              Edit Task
            </Dialog.Title>
            <Dialog.Close className="text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-full p-1 hover:bg-[var(--color-surface-soft)] transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Task Title *
              </label>
              <input
                id="edit-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Description
              </label>
              <textarea
                id="edit-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-status" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Status *
                </label>
                <select
                  id="edit-status"
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  {Object.values(TaskStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-priority" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Priority *
                </label>
                <select
                  id="edit-priority"
                  required
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  {Object.values(TaskPriority).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="edit-dueDate" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Due Date
              </label>
              <input
                id="edit-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-claude-body-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-claude-body-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
