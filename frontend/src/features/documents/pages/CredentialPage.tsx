import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react';
import { DocumentsAPI } from '../api';

export function CredentialPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Minimal form state for adding a credential
  const [provider, setProvider] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [notes, setNotes] = useState('');

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: DocumentsAPI.getCredentials,
  });

  const createMutation = useMutation({
    mutationFn: DocumentsAPI.createCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setIsAddModalOpen(false);
      setProvider('');
      setAccountEmail('');
      setNotes('');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ provider, accountEmail, notes });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Credentials Manager</h1>
          <p className="text-neutral-500 mt-1">Track access to tools and platforms without storing plaintext secrets.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Credential
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-neutral-500">Loading credentials...</div>
        ) : credentials.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
            <Shield className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No credentials tracked</h3>
            <p className="text-neutral-500 mb-6">Start logging access info to your agency tools.</p>
          </div>
        ) : (
          credentials.map(cred => (
            <div key={cred.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-semibold uppercase">
                    {cred.provider.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">{cred.provider}</h3>
                    <p className="text-xs text-neutral-500">{cred.accountEmail || 'No email specified'}</p>
                  </div>
                </div>
                <button className="text-neutral-400 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-600 mb-4 line-clamp-3 min-h-[4.5rem]">
                {cred.notes || 'No notes provided.'}
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Added {new Date(cred.createdAt).toLocaleDateString()}</span>
                </div>
                {cred.lastVerifiedAt ? (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Unverified</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-lg font-semibold text-neutral-900">Add Credential Metadata</h2>
              <p className="text-sm text-neutral-500 mt-1">We don't store passwords. Record the provider and login URL/instructions.</p>
            </div>
            <form onSubmit={handleAdd} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Provider Name</label>
                  <input 
                    type="text" 
                    required
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    placeholder="e.g. AWS, Figma, Vercel" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Account Email</label>
                  <input 
                    type="email" 
                    value={accountEmail}
                    onChange={e => setAccountEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    placeholder="hello@agency.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Notes / Instructions</label>
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    rows={3} 
                    placeholder="Login via Google SSO. Use 1Password vault for the 2FA code." 
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
