import React from 'react';

// For brevity in the CRM foundation phase, MeetingsPage acts as a placeholder
// for a calendar or list view of all meetings across opportunities.
export function MeetingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
        <p className="text-gray-500">Manage all your upcoming and past meetings.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        <p>Meeting management view will be populated with data from all opportunities here.</p>
      </div>
    </div>
  );
}
