import React from "react";
import { Link } from "@tanstack/react-router";
import { useAnalysisList } from "../api/analysisApi";

export const AnalysisListPage: React.FC = () => {
  const { data: analyses, isLoading, isError } = useAnalysisList();

  if (isLoading) return <div className="p-8">Loading analyses...</div>;
  if (isError) return <div className="p-8 text-red-500">Failed to load analyses.</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Website Analysis Engine</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEO Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTA Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analyzed At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analyses?.map((analysis) => (
              <tr key={analysis.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {analysis.lead_id} {/* Using lead_id as business placeholder */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a href={analysis.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {analysis.website_url}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {analysis.overall_score}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis.website_score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis.seo_score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis.cta_score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* Assuming route exists */}
                  <Link to="/analysis" className="text-indigo-600 hover:text-indigo-900">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {analyses?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No analyses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
