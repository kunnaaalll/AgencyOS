import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  TrendingUp, Users, IndianRupee, Activity, 
  ArrowUpRight, Target, CheckCircle2, AlertCircle, Clock, Calendar, Building
} from 'lucide-react';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/store/authStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useExecutiveSummary } from '@/features/analytics/api';
import { getSystemHealth } from '@/features/system/api';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Database, Server, HardDrive, ListTodo } from 'lucide-react';

const upcomingTasks = [
  { id: 1, title: 'Review Q3 Marketing Strategy', client: 'Acme Corp', time: '10:00 AM', status: 'pending' },
  { id: 2, title: 'Onboarding Call', client: 'TechFlow Inc', time: '1:30 PM', status: 'completed' },
  { id: 3, title: 'Finalize Proposal', client: 'Global Dynamics', time: '3:00 PM', status: 'pending' },
  { id: 4, title: 'Monthly Sync', client: 'Stark Industries', time: '4:30 PM', status: 'pending' },
];

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

export function ExecutiveDashboardPage() {
  const user = useStore(authStore, (state) => state.user);
  const isAdmin = user?.role_name === 'admin' || user?.role_name === 'Admin' || user?.first_name?.includes('Admin');

  const { data: summary, isLoading } = useExecutiveSummary();

  const revenueData = summary?.finance?.financial_trend?.map(t => ({
    name: new Date(t.date).toLocaleDateString('default', { month: 'short' }),
    revenue: t.revenue,
    expenses: t.expense
  })) || [];

  const pipelineData = summary?.sales?.pipeline_stage_distribution?.map(d => ({
    name: d.name,
    value: d.value
  })) || [];

  // Dynamic Valuation Calculation
  // Based on ~90% profit margins and a 10x ARR SaaS multiplier
  const currentMrr = revenueData.length > 0 ? revenueData[revenueData.length - 1].revenue : 0;
  const arr = currentMrr * 12;
  const valuation = arr * 10; // 10x ARR Multiple
  
  const formatValuation = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    enabled: isAdmin
  });

  if (isLoading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <motion.div 
      className="space-y-8 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-1">Good morning, {user?.first_name || 'Founder'}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Here's what's happening across your agency today.</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm border-white/60 dark:border-white/10">
          <Calendar className="w-4 h-4 text-pink-400" />
          Today, Oct 24
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={itemVariants} className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
        <MetricCard 
          title="Monthly Recurring Revenue" 
          value={<AnimatedCounter value={summary?.finance?.mrr || 0} formatValue={(v) => `₹${Math.round(v).toLocaleString()}`} />} 
          trend="+14.2%" isPositive={true} icon={IndianRupee} 
        />
        <MetricCard 
          title="Active Clients" 
          value={<AnimatedCounter value={summary?.growth?.active_clients || 0} />} 
          trend="+3" isPositive={true} icon={Users} 
        />
        <MetricCard 
          title="Qualified Leads" 
          value={<AnimatedCounter value={summary?.growth?.qualified_leads || 0} />} 
          trend="+24%" isPositive={true} icon={Target} 
        />
        <MetricCard 
          title="Total Lifetime Earnings" 
          value={<AnimatedCounter value={summary?.finance?.lifetime_revenue || 0} formatValue={(v) => `₹${Math.round(v).toLocaleString()}`} />} 
          trend="+12%" isPositive={true} icon={TrendingUp} 
        />
        {isAdmin && (
          <MetricCard 
            title="Company Valuation" 
            value={<AnimatedCounter value={valuation} formatValue={formatValuation} />} 
            trend="+10x ARR" isPositive={true} icon={Building} 
          />
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue & Expenses</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Trailing 6 months performance</p>
              </div>
              <button className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors flex items-center gap-1">
                View Full Report <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB7D5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FFB7D5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D6F4FF" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#D6F4FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val: number) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    itemStyle={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FFB7D5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expenses" stroke="#8DE3FE" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Pipeline Funnel */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <GlassCard className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pipeline</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active opportunities</p>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.4)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 13, fontWeight: 500 }} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.4)' }}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="value" fill="#E7D8FF" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {/* Upcoming Tasks */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Tasks</h2>
              <button className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors">View All</button>
            </div>
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", task.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-pink-100 text-pink-500 dark:bg-pink-900/30 dark:text-pink-400')}>
                      {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">{task.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{task.client}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-lg border border-white/40 dark:border-white/10">
                    {task.time}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* System Health (Admin Only) */}
        {isAdmin && health && (
          <motion.div variants={itemVariants}>
            <GlassCard className="h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Health</h2>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Operational
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <ListTodo className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{health.queue_depth}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Jobs in Queue</p>
                </div>
                <div className="bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Server className="w-5 h-5 text-purple-500 mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{health.active_workers}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Active Workers</p>
                </div>
                <div className="bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Database className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">100%</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">DB Uptime</p>
                </div>
                <div className="bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <HardDrive className="w-5 h-5 text-orange-500 mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{health.storage_usage}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Storage Used</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
            </div>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/60 before:to-transparent">
              {/* Activity Items */}
              <ActivityItem 
                title="New Lead Qualified" 
                desc="Acme Corp was moved to Qualified status" 
                time="10 min ago" 
                icon={Target} 
                color="text-pink-500" 
                bg="bg-pink-100"
              />
              <ActivityItem 
                title="Invoice Paid" 
                desc="TechFlow Inc paid invoice #INV-2024-089" 
                time="2 hours ago" 
                icon={IndianRupee} 
                color="text-blue-500" 
                bg="bg-blue-100"
              />
              <ActivityItem 
                title="System Update" 
                desc="AgencyOS v2.4 successfully deployed" 
                time="5 hours ago" 
                icon={CheckCircle2} 
                color="text-green-500" 
                bg="bg-green-100"
              />
              <ActivityItem 
                title="Meeting Scheduled" 
                desc="Discovery call with Global Dynamics" 
                time="Yesterday" 
                icon={Calendar} 
                color="text-purple-500" 
                bg="bg-purple-100"
              />
            </div>
          </GlassCard>
        </motion.div>
      </div>

    </motion.div>
  );
}

function MetricCard({ title, value, trend, isPositive, icon: Icon }: any) {
  return (
    <GlassCard hoverEffect>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 shadow-sm border border-white/60">
          <Icon className="w-6 h-6 text-pink-500" />
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border border-white/40", isPositive ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700")}>
          {trend}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </GlassCard>
  );
}

function ActivityItem({ title, desc, time, icon: Icon, color, bg }: any) {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--background)] bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", bg)}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
      </div>
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h4>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{time}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{desc}</p>
      </div>
    </div>
  );
}
