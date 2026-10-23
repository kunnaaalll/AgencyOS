import React from 'react'
import { Lead } from '@/features/leads/api'
import {
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  MapPin,
  Calendar,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface LeadCardProps {
  lead: Lead
  actionButton?: React.ReactNode
  onClick?: () => void
  onStatusChange?: (leadId: string, newStatus: string) => void
}

const STAGES = [
  { key: 'NEW', label: 'Cleaned' },
  { key: 'ANALYZED', label: 'Audited' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'MEETING', label: 'Meeting' },
  { key: 'PROPOSAL', label: 'Proposal' },
  { key: 'WON', label: 'Closed Won' },
]

export function LeadCard({ lead, actionButton, onClick, onStatusChange }: LeadCardProps) {
  const isDataClean = Boolean(lead.phone && lead.website)
  const score = lead.score || 75
  
  // High-Ticket Buying Power Tier
  // High-ticket digital marketing agencies charge ₹25k - ₹1L+/mo
  const isEnterpriseTier = score >= 88 || (lead.industry && ['cosmetic', 'clinic', 'real estate', 'architect', 'interior', 'implant', 'dermatology'].some(k => lead.industry?.toLowerCase().includes(k)))
  const buyingPowerTier = isEnterpriseTier
    ? { label: '₹50k - ₹1L+/mo Retainer Tier', badge: 'Enterprise High-Ticket', color: 'from-amber-500/20 to-orange-500/10 text-orange-800 border-orange-200' }
    : { label: '₹25k - ₹50k/mo Retainer Tier', badge: 'High Buying Power', color: 'from-blue-500/10 to-indigo-500/10 text-blue-800 border-blue-200' }

  // Clean phone number for WhatsApp & Calling
  const cleanPhone = lead.phone ? lead.phone.replace(/[^\d+]/g, '') : null
  const whatsappNumber = cleanPhone ? (cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : null

  // Pre-filled personalized WhatsApp pitch hook
  const whatsappPitch = encodeURIComponent(
    `Hi ${lead.business_name} team! I was reviewing your digital presence in ${lead.city || 'your area'} and noticed 2 quick conversion leaks on your website that are losing you high-intent clients to competitors. Do you have 2 minutes to see a quick 60-second video teardown?`
  )

  const currentStageIndex = Math.max(0, STAGES.findIndex(s => s.key === lead.status))

  return (
    <div 
      className={`glass-panel rounded-2xl p-5 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_16px_36px_rgb(0,0,0,0.1)] transition-all flex flex-col group h-full relative overflow-hidden bg-white/70 backdrop-blur-md ${
        onClick ? 'cursor-pointer hover:border-[var(--color-primary)]/40' : ''
      }`}
      onClick={onClick}
    >
      {/* Top Banner: Data Integrity & Buying Power Tier */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Data Cleanliness Verification */}
        {isDataClean ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Clean Data
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Partial Info
          </span>
        )}

        {/* Buying Power Score */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-gradient-to-r ${buyingPowerTier.color}`}>
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            {score}% Hot Score
          </span>
        </div>
      </div>

      {/* Business Title & Niche */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
          {lead.business_name}
        </h3>
        
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
          {lead.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {lead.city}
            </span>
          )}
          {lead.industry && (
            <span className="flex items-center gap-1 capitalize bg-gray-100/80 px-2 py-0.5 rounded-md text-gray-700">
              <Building2 className="w-3 h-3 text-gray-500" />
              {lead.industry}
            </span>
          )}
        </div>
      </div>

      {/* Buying Power Retainer Indicator */}
      <div className="mb-4 p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-orange-700 tracking-wider block">Estimated Retainer Budget</span>
          <span className="font-semibold text-gray-900">{buyingPowerTier.label}</span>
        </div>
        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-medium rounded-md text-[10px]">
          {buyingPowerTier.badge}
        </span>
      </div>

      {/* Contact Channels (Clean Data Guarantee) */}
      <div className="space-y-2 mb-4 text-xs">
        {lead.phone ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-700 font-medium truncate">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappPitch}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                  title="Send instant personalized WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </a>
              )}
              <a
                href={`tel:${cleanPhone}`}
                className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                title="Direct Phone Call"
              >
                <Phone className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 italic text-xs flex items-center gap-1.5 p-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> No phone number recorded
          </div>
        )}

        {lead.website ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-700 truncate">
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
            </div>
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 text-blue-600 hover:text-blue-800 shrink-0"
              title="Open Website"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : null}

        {lead.email && (
          <div className="flex items-center gap-2 text-gray-600 truncate px-2 py-1">
            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <a 
              href={`mailto:${lead.email}`} 
              onClick={e => e.stopPropagation()}
              className="truncate hover:underline text-gray-700"
            >
              {lead.email}
            </a>
          </div>
        )}
      </div>

      {/* Lifecycle Tracking Stepper */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Pipeline Stage
          </span>
          {onStatusChange ? (
            <select
              value={lead.status}
              onClick={e => e.stopPropagation()}
              onChange={e => onStatusChange(lead.id, e.target.value)}
              className="text-[11px] font-medium bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 cursor-pointer focus:outline-none"
            >
              {STAGES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
              <option value="LOST">Disqualified</option>
            </select>
          ) : (
            <span className="text-[11px] font-semibold text-gray-700 px-2 py-0.5 rounded bg-gray-100">
              {STAGES.find(s => s.key === lead.status)?.label || lead.status}
            </span>
          )}
        </div>

        {/* Mini Visual Stepper Dots */}
        <div className="grid grid-cols-6 gap-1 mb-3">
          {STAGES.map((s, idx) => {
            const isCompleted = idx <= currentStageIndex
            const isCurrent = idx === currentStageIndex
            return (
              <div 
                key={s.key} 
                className={`h-1.5 rounded-full transition-all ${
                  isCurrent ? 'bg-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' :
                  isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
                title={`${s.label} (${idx <= currentStageIndex ? 'Completed' : 'Pending'})`}
              />
            )
          })}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between gap-2 pt-1" onClick={e => e.stopPropagation()}>
          <Link
            to="/leads/$id/analysis"
            params={{ id: lead.id }}
            className="text-xs font-semibold text-[var(--color-primary)] hover:text-black flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Audit Pitch
          </Link>

          {actionButton}
        </div>
      </div>
    </div>
  )
}
