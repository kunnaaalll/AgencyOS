import React, { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { outreachApi } from '../api/outreachApi';

export const OutreachDetailPage: React.FC = () => {
  const { draftId } = useParams({ strict: false }) as { draftId: string };
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const { data: draft, isLoading, error } = useQuery({
    queryKey: ['outreach_draft', draftId],
    queryFn: () => outreachApi.getDraftById(draftId!),
    enabled: !!draftId,
  });

  useEffect(() => {
    if (draft) {
      setMessage(draft.message || '');
      setSubject(draft.subject || '');
    }
  }, [draft]);

  const updateMutation = useMutation({
    mutationFn: (data: { status?: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'USED', message?: string, subject?: string }) => 
      outreachApi.updateDraft(draftId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach_draft', draftId] });
      queryClient.invalidateQueries({ queryKey: ['outreach_drafts'] });
    }
  });

  if (isLoading) return <div className="p-8">Loading outreach draft details...</div>;
  if (error || !draft) return <div className="p-8 text-red-500">Failed to load outreach draft.</div>;

  const handleSave = () => {
    updateMutation.mutate({ message, subject });
  };

  const handleStatusChange = (status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'USED') => {
    updateMutation.mutate({ status, message, subject });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/outreach" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          &larr; Back to List
        </Link>
        <div className="space-x-3">
          <button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Save Edits
          </button>
          {draft.status !== 'APPROVED' && (
            <button 
              onClick={() => handleStatusChange('APPROVED')}
              disabled={updateMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Approve
            </button>
          )}
          {draft.status === 'APPROVED' && (
            <button 
              onClick={() => handleStatusChange('USED')}
              disabled={updateMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Mark Used
            </button>
          )}
          {draft.status !== 'REJECTED' && (
            <button 
              onClick={() => handleStatusChange('REJECTED')}
              disabled={updateMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Reject
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Outreach Draft Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Lead ID: {draft.lead_id} | Channel: {draft.channel}</p>
          </div>
          <div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              draft.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
              draft.status === 'USED' ? 'bg-blue-100 text-blue-800' :
              draft.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {draft.status}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <div className="mt-1">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="Subject Line or Topic"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Message Draft</label>
            <div className="mt-1">
              <textarea
                rows={10}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Talking Points</h4>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-900">
              {draft.talking_points?.map((pt, i) => <li key={i}>{pt}</li>)}
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
};
