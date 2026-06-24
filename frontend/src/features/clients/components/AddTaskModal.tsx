import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
  }) => Promise<void>;
}

export function AddTaskModal({ isOpen, onClose, onSubmit }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setStatus(TaskStatus.TODO);
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
      onClose();
    } catch (error) {
      console.error('Failed to add task:', error);
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
              Add New Task
            </Dialog.Title>
            <Dialog.Close className="text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-full p-1 hover:bg-[var(--color-surface-soft)] transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Task Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="e.g. Design Homepage"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                placeholder="Add any additional details here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Status *
                </label>
                <select
                  id="status"
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
                <label htmlFor="priority" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Priority *
                </label>
                <select
                  id="priority"
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
              <label htmlFor="dueDate" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
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
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
