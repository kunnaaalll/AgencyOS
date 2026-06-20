import React from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useAnalysisDetail, useRunAnalysis } from "../api/analysisApi";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export const AnalysisDetailPage: React.FC = () => {
  // Assume router defines 'leadId' as a param
  const { leadId } = useParams({ strict: false }) as { leadId: string };
  const { data: analysis, isLoading, isError } = useAnalysisDetail(leadId);
  const runAnalysis = useRunAnalysis();

  if (isLoading) return <div className="p-8">Loading analysis details...</div>;
  if (isError) return <div className="p-8 text-red-500">Failed to load analysis details.</div>;

  if (!analysis) {
    return (
      <div className="p-8">
        <h2 className="text-xl mb-4">No analysis found for this lead.</h2>
        <button
          onClick={() => runAnalysis.mutate(leadId)}
          disabled={runAnalysis.isPending}
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {runAnalysis.isPending ? "Running Analysis..." : "Run Analysis"}
        </button>
      </div>
    );
  }

  const chartData = [
    { subject: "Website", A: analysis.website_score || 0, fullMark: 20 },
    { subject: "SEO", A: analysis.seo_score || 0, fullMark: 20 },
    { subject: "Mobile", A: analysis.mobile_score || 0, fullMark: 15 },
    { subject: "CTA", A: analysis.cta_score || 0, fullMark: 15 },
    { subject: "Social", A: analysis.social_score || 0, fullMark: 15 },
    { subject: "Digital Maturity", A: analysis.digital_maturity_score || 0, fullMark: 15 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysis: {analysis.website_url}</h1>
          <p className="text-gray-500 mt-2">Overall Score: <span className="font-bold text-indigo-600">{analysis.overall_score}</span></p>
        </div>
        <div className="space-x-4">
          <Link to="/analysis" className="text-indigo-600 hover:underline">Back to List</Link>
          <button
            onClick={() => runAnalysis.mutate(leadId)}
            disabled={runAnalysis.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {runAnalysis.isPending ? "Re-running..." : "Re-run Analysis"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
                <Radar name="Score" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Strengths</h3>
            <ul className="list-disc pl-5 text-green-700 space-y-1">
              {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
              {analysis.strengths.length === 0 && <li>None identified.</li>}
            </ul>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-100">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Weaknesses</h3>
            <ul className="list-disc pl-5 text-orange-700 space-y-1">
              {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              {analysis.weaknesses.length === 0 && <li>None identified.</li>}
            </ul>
          </div>

          <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-100">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Pain Points</h3>
            <ul className="list-disc pl-5 text-red-700 space-y-1">
              {analysis.pain_points.map((p, i) => <li key={i}>{p}</li>)}
              {analysis.pain_points.length === 0 && <li>None identified.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
