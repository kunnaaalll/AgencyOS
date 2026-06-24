import React from 'react'
import { Lead } from '@/features/leads/api'
import { Building2, Mail, Sparkles, Calendar, UserCheck } from 'lucide-react'

interface LeadCardProps {
  lead: Lead
  actionButton?: React.ReactNode
  onClick?: () => void
}

export function LeadCard({ lead, actionButton, onClick }: LeadCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 border border-white/40 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.15)] transition-all flex flex-col group h-full ${onClick ? 'cursor-pointer hover:border-[var(--color-accent-pink)] hover:bg-white/40' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[var(--color-accent-blue)] transition-colors line-clamp-1">{lead.business_name}</h3>
          <p className="text-gray-500 font-medium flex items-center gap-1.5 mt-1">
            <UserCheck className="w-4 h-4 text-gray-400" />
            {lead.email ? lead.email.split('@')[0] : 'Owner'}
          </p>
        </div>
        
        {/* Intent Score Badge */}
        <div className="flex flex-col items-end">
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
            (lead.score || 0) >= 90 ? 'bg-pink-100/80 text-pink-700 border-pink-200' : 
            (lead.score || 0) >= 80 ? 'bg-blue-100/80 text-blue-700 border-blue-200' : 
            'bg-gray-100/80 text-gray-700 border-gray-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            {lead.score || 0} Intent
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6 flex-1">
        {lead.industry && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{lead.industry}</span>
          </div>
        )}
        
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Added {new Date(lead.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/30 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {lead.status === 'NEW' ? 'Available' : 'Claimed'}
        </div>
        {actionButton}
      </div>
    </div>
  )
}
