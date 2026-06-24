import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ClientStatus, HealthStatus, Client } from '../types';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSubmit: (id: string, data: Partial<Client>) => Promise<void>;
}

export function EditClientModal({ isOpen, onClose, client, onSubmit }: EditClientModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [monthlyRetainer, setMonthlyRetainer] = useState<number | ''>('');
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.ACTIVE);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(HealthStatus.HEALTHY);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      setBusinessName(client.business_name);
      setMonthlyRetainer(client.monthly_retainer || '');
      setStatus(client.status);
      setHealthStatus(client.health_status);
      setContactName(client.primary_contact_name || '');
      setContactEmail(client.primary_contact_email || '');
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !businessName || monthlyRetainer === '') return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(client.id, {
        business_name: businessName,
        monthly_retainer: Number(monthlyRetainer),
        status,
        health_status: healthStatus,
        primary_contact_name: contactName || undefined,
        primary_contact_email: contactEmail || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update client:', error);
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
              Edit Client
            </Dialog.Title>
            <Dialog.Close className="text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-full p-1 hover:bg-[var(--color-surface-soft)] transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-businessName" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Business Name *
              </label>
              <input
                id="edit-businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="edit-monthlyRetainer" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                Monthly Retainer (₹) *
              </label>
              <input
                id="edit-monthlyRetainer"
                type="number"
                required
                min="0"
                value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
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
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  {Object.values(ClientStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-healthStatus" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Health Status *
                </label>
                <select
                  id="edit-healthStatus"
                  required
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value as HealthStatus)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  {Object.values(HealthStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-contactName" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Contact Name
                </label>
                <input
                  id="edit-contactName"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="edit-contactEmail" className="block text-claude-body-sm font-semibold text-[var(--color-ink)] mb-1">
                  Contact Email
                </label>
                <input
                  id="edit-contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-lg px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
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
