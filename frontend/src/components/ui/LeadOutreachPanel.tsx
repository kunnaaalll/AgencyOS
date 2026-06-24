import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lead } from '@/store/leadsStore'
import { X, Send, Bot, Sparkles, Building2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from './button'

interface LeadOutreachPanelProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
}

export function LeadOutreachPanel({ lead, isOpen, onClose }: LeadOutreachPanelProps) {
  const [chatInput, setChatInput] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Initialize draft when a lead is opened
  useEffect(() => {
    if (lead && isOpen) {
      setEmailDraft(
        `Hi ${lead.name.split(' ')[0]},\n\n` +
        `I noticed that ${lead.company} is doing great work in the ${lead.industry || 'industry'} space. ` +
        `However, while reviewing your website, I spotted a few issues that might be hurting your conversions:\n\n` +
        `${lead.analysis?.problems.map(p => `- ${p}`).join('\n') || '- Lack of clear CTA'}\n\n` +
        `I'd love to share a quick 3-minute video showing how we can fix this and improve your SEO score (currently estimated at ${lead.analysis?.seoScore || 50}/100).\n\n` +
        `Are you open to me sending that over?\n\n` +
        `Best,\nAdmin`
      )
    }
  }, [lead, isOpen])

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isAiLoading) return

    const userPrompt = chatInput
    setChatInput('')
    setIsAiLoading(true)

    // Mock AI response delay
    setTimeout(() => {
      let newDraft = emailDraft
      if (userPrompt.toLowerCase().includes('shorter')) {
        newDraft = `Hi ${lead?.name.split(' ')[0]},\n\nLove what ${lead?.company} is doing. I found a few SEO issues on your site (like missing H1s) that are likely costing you traffic.\n\nMind if I send over a quick 3-min video showing how to fix them?\n\nBest,\nAdmin`
      } else if (userPrompt.toLowerCase().includes('casual')) {
        newDraft = `Hey ${lead?.name.split(' ')[0]}!\n\nHuge fan of ${lead?.company}. Was checking out your site and noticed a few quick SEO wins you're missing out on.\n\nWant me to shoot over a quick video breakdown?\n\nCheers,\nAdmin`
      } else {
        newDraft = `[AI Applied changes for: "${userPrompt}"]\n\n` + emailDraft
      }
      setEmailDraft(newDraft)
      setIsAiLoading(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && lead && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col border-l border-white/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Outreach: {lead.company}</h2>
                <p className="text-sm text-gray-500 mt-1">Chat with AI to refine your pitch.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
              
              {/* Company Intelligence */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Company Intelligence
                </h3>
                
                <div className="glass-panel p-5 rounded-2xl border border-white border-b-gray-100 shadow-sm bg-white/80">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Estimated SEO Score</span>
                    <span className={`text-sm font-bold ${lead.analysis && lead.analysis.seoScore < 50 ? 'text-red-500' : 'text-amber-500'}`}>
                      {lead.analysis?.seoScore || 50} / 100
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Identified Problems
                    </span>
                    <ul className="space-y-2">
                      {lead.analysis?.problems.map((prob, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          {prob}
                        </li>
                      )) || <li className="text-sm text-gray-500">No specific problems identified yet.</li>}
                    </ul>
                  </div>

                  {lead.analysis?.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 italic">
                      " {lead.analysis.notes} "
                    </div>
                  )}
                </div>
              </div>

              {/* Email Draft Area */}
              <div className="space-y-4 flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4" /> Email Draft
                </h3>
                
                <div className="flex-1 relative group">
                  <textarea
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    className="w-full h-64 p-5 rounded-2xl border border-gray-200 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-100 outline-none resize-none transition-all text-gray-700 text-sm leading-relaxed"
                  />
                  {isAiLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center border border-pink-100">
                      <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                      <span className="text-sm font-medium text-pink-600">AI is rewriting...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Chat Input Box */}
            <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
              <form onSubmit={handleChatSubmit} className="relative">
                <div className="absolute left-4 top-3 text-pink-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tell AI to change it (e.g., 'Make it shorter', 'Make it casual')"
                  disabled={isAiLoading}
                  className="w-full pl-12 pr-16 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-pink-300 focus:ring focus:ring-pink-100 outline-none transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isAiLoading}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Bot className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-4 flex justify-end">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-md">
                  Copy to Clipboard & Open Mail
                </Button>
              </div>
            </div>
            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
