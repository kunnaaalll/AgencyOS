import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { PipelineStage, Opportunity } from '../types';

interface EditOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onSubmit: (id: string, data: Partial<Opportunity>) => Promise<void>;
}

export function EditOpportunityModal({ isOpen, onClose, opportunity, onSubmit }: EditOpportunityModalProps) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState<number | ''>('');
  const [probability, setProbability] = useState<number | ''>('');
  const [stage, setStage] = useState<PipelineStage>(PipelineStage.NEW);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.title);
      setValue(opportunity.value);
      setProbability(opportunity.probability);
      setStage(opportunity.pipeline_stage);
      setExpectedCloseDate(
        opportunity.expected_close_date 
          ? new Date(opportunity.expected_close_date).toISOString().split('T')[0] 
          : ''
      );
    }
  }, [opportunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunity || !title || value === '' || probability === '') return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(opportunity.id, {
        title,
        value: Number(value),
        probability: Number(probability),
        pipeline_stage: stage,
        expected_close_date: expectedCloseDate || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update opportunity:', error);
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
              Edit Opportunity
            </Dialog.Title>
            <Dialog.Close className="text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-full p-1 hover:bg-[var(--color-surface-soft)] transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Opportunity Title *
              </label>
              <input
                id="edit-title"
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
                <label htmlFor="edit-value" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Value (₹) *
                </label>
                <input
                  id="edit-value"
                  type="number"
                  required
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="edit-probability" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Probability (%) *
                </label>
                <input
                  id="edit-probability"
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-stage" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Pipeline Stage *
              </label>
              <select
                id="edit-stage"
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
              <label htmlFor="edit-expectedCloseDate" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Expected Close Date
              </label>
              <input
                id="edit-expectedCloseDate"
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
