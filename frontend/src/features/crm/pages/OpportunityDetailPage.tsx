import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { crmApi } from '../api';
import { Opportunity, Activity, Meeting } from '../types';
import { format } from 'date-fns';

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (oppId: string) => {
    try {
      const [oppData, actData, mtgData] = await Promise.all([
        crmApi.getOpportunity(oppId),
        crmApi.getActivities(oppId),
        crmApi.getMeetings(oppId),
      ]);
      setOpportunity(oppData);
      setActivities(actData);
      setMeetings(mtgData);
    } catch (error) {
      console.error('Failed to load opportunity details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading opportunity details...</div>;
  }

  if (!opportunity) {
    return <div className="p-8 text-red-500">Opportunity not found</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left Column: Overview and Info */}
      <div className="w-full lg:w-2/3 space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{opportunity.title}</h1>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {opportunity.pipeline_stage}
            </span>
          </div>
          <p className="text-gray-500 text-lg">Value: ${opportunity.value.toLocaleString()} &bull; Probability: {opportunity.probability}%</p>
        </div>

        {/* Overview Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Overview</h2>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-sm text-gray-500">Expected Close Date</p>
              <p className="font-medium text-gray-900">
                {opportunity.expected_close_date ? format(new Date(opportunity.expected_close_date), 'MMMM d, yyyy') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lead ID</p>
              <p className="font-medium text-gray-900">{opportunity.lead_id}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-gray-900 whitespace-pre-wrap mt-1">{opportunity.notes || 'No notes available.'}</p>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Activities</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Add Activity
            </button>
          </div>
          {activities.length === 0 ? (
            <p className="text-gray-500">No activities recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => (
                <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{activity.title}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{activity.activity_type}</span>
                      </div>
                      {activity.description && <p className="text-gray-600 text-sm mt-1">{activity.description}</p>}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{format(new Date(activity.created_at), 'MMM d, h:mm a')}</p>
                      {activity.completed_at && <p className="text-green-600 mt-1 flex items-center justify-end gap-1">✓ Completed</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meetings List */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Meetings</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Schedule Meeting
            </button>
          </div>
          {meetings.length === 0 ? (
            <p className="text-gray-500">No meetings scheduled.</p>
          ) : (
            <div className="space-y-4">
              {meetings.map(meeting => (
                <div key={meeting.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">{meeting.meeting_type} Meeting</span>
                    <span className="text-sm font-medium text-blue-600">
                      {format(new Date(meeting.scheduled_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <p><span className="text-gray-400">Duration:</span> {meeting.duration_minutes} min</p>
                    {meeting.location && <p><span className="text-gray-400">Location:</span> {meeting.location}</p>}
                    {meeting.outcome && <p className="col-span-2"><span className="text-gray-400">Outcome:</span> {meeting.outcome}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Timeline / Sidebar */}
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h3>
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
            {/* Mock Timeline Events */}
            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></span>
              <p className="text-sm font-medium text-gray-900">Opportunity Created</p>
              <p className="text-xs text-gray-500 mt-0.5">{format(new Date(opportunity.created_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></span>
              <p className="text-sm font-medium text-gray-900">Moved to {opportunity.pipeline_stage}</p>
              <p className="text-xs text-gray-500 mt-0.5">{format(new Date(opportunity.updated_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
