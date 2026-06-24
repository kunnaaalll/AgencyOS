import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/store/authStore';
import { 
  User, IndianRupee, Users, Target, TrendingUp, Calendar, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useQuery } from '@tanstack/react-query';
import { useFinanceMetrics } from '@/features/analytics/api';
import { crmApi } from '@/features/crm/api';

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

  const monthlyCommissionData = financeMetrics?.financial_trend?.map(t => ({
    name: new Date(t.date).toLocaleDateString('default', { month: 'short' }),
    value: t.revenue * 0.15 // Assuming 15% equity/commission payout
  })) || [];

  const recentDeals = opportunities?.filter(o => o.pipeline_stage === 'WON').slice(0, 3).map(o => ({
    id: o.id,
    client: o.lead_id || 'Unknown Client',
    value: o.value,
    date: new Date(o.created_at || Date.now()).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: o.pipeline_stage
  })) || [];

  const totalPayout = monthlyCommissionData.length > 0 
    ? monthlyCommissionData[monthlyCommissionData.length - 1].value 
    : 0;

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-indigo-500 flex items-center justify-center shadow-lg border-2 border-white">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-1">{user?.first_name || 'Co-Founder'}</h1>
            <p className="text-gray-500 font-medium text-sm capitalize">{user?.role_name || 'Sales Partner'}</p>
          </div>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-gray-700 shadow-sm border-white/60">
          <Calendar className="w-4 h-4 text-pink-400" />
          June 2024
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Recent Equity Payout" value={`₹${totalPayout.toLocaleString()}`} trend="15% Equity Share" isPositive={true} icon={IndianRupee} highlight={true} />
        <MetricCard title="Total Onboarded Clients" value="48" trend="+4 this month" isPositive={true} icon={Users} />
        <MetricCard title="Active Clients Managed" value="32" trend="92% Retention" isPositive={true} icon={Target} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Equity Distribution History</h2>
                <p className="text-sm text-gray-500">Your monthly equity payouts over the last 6 months</p>
              </div>
              <button className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors flex items-center gap-1">
                View Details <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCommissionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val: number) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.4)' }}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Equity Payout']}
                  />
                  <Bar dataKey="value" fill="url(#colorCommission)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    <defs>
                      <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFB7D5" />
                        <stop offset="100%" stopColor="#8DE3FE" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent Deals */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <GlassCard className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Agency Deals</h2>
                <p className="text-sm text-gray-500">Adding to the equity pool</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {recentDeals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between p-4 rounded-xl bg-white/40 border border-white/60 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{deal.client}</h4>
                      <p className="text-xs text-gray-500 font-medium">{deal.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{deal.value.toLocaleString()}</p>
                    <p className="text-xs font-medium text-green-600">Won</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

    </motion.div>
  );
}

function MetricCard({ title, value, trend, isPositive, icon: Icon, highlight = false }: any) {
  return (
    <GlassCard hoverEffect className={cn(highlight && "ring-2 ring-pink-400/50 relative overflow-hidden")}>
      {highlight && (
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl"></div>
      )}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 shadow-sm border border-white/60">
          <Icon className="w-6 h-6 text-pink-500" />
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border border-white/40", isPositive ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700")}>
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className={cn("text-3xl font-bold tracking-tight mb-1", highlight ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-600" : "text-gray-900")}>
          {value}
        </h3>
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
    </GlassCard>
  );
}
