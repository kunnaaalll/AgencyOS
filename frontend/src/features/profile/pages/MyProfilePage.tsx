import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/store/authStore';
import { 
  User, IndianRupee, Users, Target, Calendar, CheckCircle2, ArrowUpRight, Mail, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useFinanceMetrics } from '@/features/analytics/api';
import { crmApi } from '@/features/crm/api';
import { fetchLeads } from '@/features/leads/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export function MyProfilePage() {
  const { user } = useStore(authStore);

  const { data: financeMetrics } = useFinanceMetrics();
  
  const { data: opportunities } = useQuery({
    queryKey: ['my-recent-deals'],
    queryFn: crmApi.getOpportunities
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchLeads()
  });

  const monthlyCommissionData = financeMetrics?.financial_trend?.map(t => ({
    name: new Date(t.date).toLocaleDateString('default', { month: 'short' }),
    value: (t.revenue || 0) * 0.15
  })) || [];

  const recentDeals = (Array.isArray(opportunities) ? opportunities : [])
    .filter(o => o.pipeline_stage === 'WON')
    .slice(0, 3)
    .map(o => ({
      id: o.id,
      client: o.lead_id || 'Client Account',
      value: o.value || 0,
      date: new Date(o.created_at || Date.now()).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: o.pipeline_stage
    }));

  const totalPayout = monthlyCommissionData.length > 0 
    ? monthlyCommissionData[monthlyCommissionData.length - 1].value 
    : 0;

  const currentDateStr = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
  const fullName = user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Super Admin');
  const roleName = user?.role_name || 'Super Admin';
  const email = user?.email || 'admin@agencyos.io';
  const totalLeadsCount = Array.isArray(leads) ? leads.length : 0;
  const qualifiedCount = Array.isArray(leads) ? leads.filter(l => l.status === 'QUALIFIED' || l.score && l.score >= 80).length : 0;

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-6 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-800">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">{fullName}</h1>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                <Shield className="w-3.5 h-3.5" />
                {roleName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {email}
              </span>
            </div>
          </div>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          {currentDateStr}
        </div>
      </motion.div>

      {/* Real KPI Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Recent Commission Payout" 
          value={`₹${totalPayout.toLocaleString()}`} 
          trend="Live Ledger" 
          isPositive={true} 
          icon={IndianRupee} 
          highlight={true} 
        />
        <MetricCard 
          title="Total Pipeline Records" 
          value={totalLeadsCount.toString()} 
          trend="Live Database" 
          isPositive={true} 
          icon={Users} 
        />
        <MetricCard 
          title="High-Intent Qualified Leads" 
          value={qualifiedCount.toString()} 
          trend="AI Qualified" 
          isPositive={true} 
          icon={Target} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard className="h-[380px] flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Revenue & Commission Payouts</h2>
                <p className="text-xs text-zinc-500">Live agency distribution ledger over the last 6 months</p>
              </div>
              <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors flex items-center gap-1">
                View Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 w-full min-h-0">
              {monthlyCommissionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCommissionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(val: number) => `₹${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Payout']}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-xs">
                  <p>No historical distribution payouts recorded yet.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent Deals */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <GlassCard className="h-[380px] flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Closed Agency Deals</h2>
                <p className="text-xs text-zinc-500">Won opportunities contributing to revenue</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {recentDeals.length > 0 ? (
                recentDeals.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{deal.client}</h4>
                        <p className="text-[10px] text-zinc-500">{deal.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">₹{deal.value.toLocaleString()}</p>
                      <p className="text-[10px] font-semibold text-emerald-600">Won</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 p-4">
                  <p className="text-xs font-medium mb-1">No closed deals recorded yet</p>
                  <p className="text-[11px] text-zinc-500">Track and advance high-intent leads into won contracts in CRM Pipeline.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

    </motion.div>
  );
}

function MetricCard({ title, value, trend, isPositive, icon: Icon, highlight = false }: any) {
  return (
    <GlassCard hoverEffect className={cn("p-6", highlight && "ring-1 ring-indigo-500/30")}>
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className={cn("px-2 py-0.5 rounded-md text-[11px] font-bold", isPositive ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-rose-50 text-rose-700")}>
          {trend}
        </div>
      </div>
      <div>
        <h3 className={cn("text-2xl font-bold tracking-tight mb-0.5 text-zinc-900 dark:text-zinc-100", highlight && "text-indigo-600 dark:text-indigo-400")}>
          {value}
        </h3>
        <p className="text-xs font-medium text-zinc-500">{title}</p>
      </div>
    </GlassCard>
  );
}
