import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { qualificationApi } from '../api/qualificationApi';

export const QualificationDetailPage: React.FC = () => {
  const { leadId } = useParams({ strict: false }) as { leadId: string };

  const { data: q, isLoading, error } = useQuery({
    queryKey: ['qualification', leadId],
    queryFn: () => qualificationApi.getQualificationByLead(leadId!),
    enabled: !!leadId,
  });

  if (isLoading) return <div className="p-8">Loading qualification details...</div>;
  if (error || !q) return <div className="p-8 text-red-500">Failed to load qualification details.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/qualifications" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          &larr; Back to List
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">AI Qualification Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Lead ID: {q.lead_id}</p>
          </div>
          <div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              q.priority === 'HIGH' ? 'bg-green-100 text-green-800' : 
              q.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {q.priority} Priority
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{q.qualification_status}</dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Opportunity Score</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{q.opportunity_score}/100</dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Confidence</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{(q.confidence * 100).toFixed(1)}%</dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Executive Summary</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{q.summary || 'N/A'}</dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Pain Points</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul className="list-disc pl-5 space-y-1">
                  {q.pain_points && q.pain_points.length > 0 ? (
                    q.pain_points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))
                  ) : (
                    <li>No specific pain points identified.</li>
                  )}
                </ul>
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Recommended Pitch</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{q.recommended_pitch || 'N/A'}</dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Recommended Package</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{q.recommended_package || 'N/A'}</dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Raw Website Analysis</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {q.website_analysis_id ? (
                  <Link to="/analysis/$leadId" params={{ leadId: q.lead_id }} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View Full Analysis &rarr;
              </Link>
                ) : (
                  'No linked analysis'
                )}
              </dd>
            </div>
            
          </dl>
        </div>
      </div>
    </div>
  );
};
