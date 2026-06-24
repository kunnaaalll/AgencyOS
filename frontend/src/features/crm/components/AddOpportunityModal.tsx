import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { PipelineStage } from '../types';

interface AddOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    value: number;
    probability: number;
    pipeline_stage: PipelineStage;
    expected_close_date?: string;
  }) => Promise<void>;
}

export function AddOpportunityModal({ isOpen, onClose, onSubmit }: AddOpportunityModalProps) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState<number | ''>('');
  const [probability, setProbability] = useState<number | ''>('');
  const [stage, setStage] = useState<PipelineStage>(PipelineStage.NEW);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || value === '' || probability === '') return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        value: Number(value),
        probability: Number(probability),
        pipeline_stage: stage,
        expected_close_date: expectedCloseDate || undefined,
      });
      // Reset form
      setTitle('');
      setValue('');
      setProbability('');
      setStage(PipelineStage.NEW);
      setExpectedCloseDate('');
      onClose();
    } catch (error) {
      console.error('Failed to add opportunity:', error);
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
              New Opportunity
            </Dialog.Title>
            <Dialog.Close className="text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-full p-1 hover:bg-[var(--color-surface-soft)] transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Opportunity Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="e.g. Website Redesign for Acme Corp"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="value" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Value (₹) *
                </label>
                <input
                  id="value"
                  type="number"
                  required
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <label htmlFor="probability" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Probability (%) *
                </label>
                <input
                  id="probability"
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="e.g. 75"
                />
              </div>
            </div>

            <div>
              <label htmlFor="stage" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Pipeline Stage *
              </label>
              <select
                id="stage"
                required
                value={stage}
                onChange={(e) => setStage(e.target.value as PipelineStage)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                {Object.values(PipelineStage).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expectedCloseDate" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Expected Close Date
              </label>
              <input
                id="expectedCloseDate"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
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
                {isSubmitting ? 'Creating...' : 'Create Opportunity'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
