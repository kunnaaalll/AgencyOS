import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { fetchLeadById } from '../api'
import { Building2, Globe, MapPin, Phone, Mail, Instagram, Linkedin, ArrowLeft, BarChart } from 'lucide-react'

export function LeadDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  
  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
  })

  if (isLoading) {
    return <div className="p-8 text-center text-surface-500">Loading lead details...</div>
  }

  if (!lead) {
    return <div className="p-8 text-center text-red-500">Lead not found.</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/leads" className="p-2 hover:bg-surface-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-surface-500" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">{lead.business_name}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
            <span className="px-2 py-0.5 bg-surface-100 rounded-md">{lead.status}</span>
            {lead.priority && (
              <span className={`px-2 py-0.5 rounded-md ${lead.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {lead.priority} Priority
              </span>
            )}
            <span>Added {new Date(lead.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="ml-auto">
          <Link
            to={`/leads/${id}/analysis`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart className="w-4 h-4" />
            View Analysis
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Business Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-surface-600">
              <Building2 className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">Industry</p>
                <p className="font-medium">{lead.industry || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-surface-600">
              <MapPin className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">Location</p>
                <p className="font-medium">{[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-surface-600">
              <Globe className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">Website</p>
                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                    {lead.website}
                  </a>
                ) : (
                  <p className="font-medium">-</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-surface-600">
              <Phone className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">Phone</p>
                <p className="font-medium">{lead.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-surface-600">
              <Mail className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">Email</p>
                <p className="font-medium">{lead.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-surface-600">
              <Instagram className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">Instagram</p>
                {lead.instagram_url ? (
                  <a href={lead.instagram_url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                    Profile
                  </a>
                ) : <p className="font-medium">-</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 text-surface-600">
              <Linkedin className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">LinkedIn</p>
                {lead.linkedin_url ? (
                  <a href={lead.linkedin_url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                    Profile
                  </a>
                ) : <p className="font-medium">-</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
