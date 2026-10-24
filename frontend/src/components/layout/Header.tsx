import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, User, Command } from 'lucide-react';
import { useRouterState } from '@tanstack/react-router';

export function Header() {
  const routerState = useRouterState();
  const pathname = routerState?.location?.pathname || '/';

  const getBreadcrumb = (path: string) => {
    if (path.startsWith('/discovery')) return { section: 'Growth OS', current: 'Lead Discovery' };
    if (path.startsWith('/leads')) return { section: 'Growth OS', current: 'All Leads' };
    if (path.startsWith('/analysis')) return { section: 'Growth OS', current: 'Website Audits' };
    if (path.startsWith('/qualifications')) return { section: 'Growth OS', current: 'Qualifications' };
    if (path.startsWith('/crm')) return { section: 'Growth OS', current: 'CRM Pipeline' };
    if (path.startsWith('/outreach')) return { section: 'Growth OS', current: 'Outreach' };
    if (path.startsWith('/clients')) return { section: 'Delivery OS', current: 'Clients' };
    if (path.startsWith('/tasks') || path.startsWith('/projects')) return { section: 'Delivery OS', current: 'Tasks' };
    if (path.startsWith('/knowledge')) return { section: 'Delivery OS', current: 'Knowledge' };
    if (path.startsWith('/documents')) return { section: 'Delivery OS', current: 'Documents' };
    if (path.startsWith('/finance')) return { section: 'Business OS', current: 'Finance' };
    if (path.startsWith('/analytics')) return { section: 'Business OS', current: 'Analytics' };
    if (path.startsWith('/settings')) return { section: 'Platform', current: 'Settings' };
    return { section: 'Overview', current: 'Dashboard' };
  };

  const breadcrumb = getBreadcrumb(pathname);

  const openCmdK = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <motion.header 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 flex items-center justify-between px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 z-20"
    >
      <div className="flex items-center">
        <div className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
          <span>{breadcrumb.section}</span>
          <span className="text-slate-300 dark:text-zinc-700">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">{breadcrumb.current}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar / Command Palette Trigger */}
        <div 
          onClick={openCmdK}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl cursor-pointer bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 transition-all border border-slate-200/80 dark:border-zinc-800 text-slate-500 dark:text-slate-400 w-64 shadow-xs group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="text-xs font-medium flex-1">Search anything...</span>
          <div className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-900 transition-all border border-slate-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 shadow-xs cursor-pointer">
            <Bell className="w-4 h-4" />
          </button>
        </div>

        {/* Profile */}
        <div className="p-1 pr-3 rounded-xl flex items-center gap-2.5 shadow-xs hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer border border-slate-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">Admin User</span>
            <span className="text-[10px] text-slate-400 font-medium">Founder</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
