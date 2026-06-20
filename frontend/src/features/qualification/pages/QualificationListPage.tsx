import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { qualificationApi } from '../api/qualificationApi';
import { Link } from 'react-router-dom';

export const QualificationListPage: React.FC = () => {
  const { data: qualifications, isLoading, error } = useQuery({
    queryKey: ['qualifications'],
    queryFn: qualificationApi.getQualifications,
  });

  if (isLoading) return <div className="p-8">Loading qualifications...</div>;
  if (error) return <div className="p-8 text-red-500">Failed to load qualifications.</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Qualifications</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead ID (Business)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Package</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {qualifications?.map((q) => (
              <tr key={q.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {q.lead_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    q.priority === 'HIGH' ? 'bg-green-100 text-green-800' : 
                    q.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {q.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {q.opportunity_score}/100
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {q.qualification_status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {q.recommended_package || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(q.confidence * 100).toFixed(0)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to={`/qualifications/${q.lead_id}`} className="text-indigo-600 hover:text-indigo-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {qualifications?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No qualifications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
