import React from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { 
  Home, Users, Target, Send, Briefcase, CheckSquare, 
  BookOpen, Folder, DollarSign, BarChart2, Activity,
  Settings, Bell, Monitor, Search, LogOut, Zap, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, authStore } from '@/store/authStore';
import { useStore } from '@tanstack/react-store';

const getNavGroups = (role?: string) => {
  const groups = [
    {
      title: 'Growth OS',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Lead Discovery', path: '/discovery/runs', icon: Search },
        { name: 'All Leads', path: '/leads', icon: Target },
        { name: 'Website Audits', path: '/analysis', icon: Activity },
        { name: 'Qualifications', path: '/qualifications', icon: Zap },
        { name: 'CRM Pipeline', path: '/crm', icon: Briefcase },
        { name: 'Outreach', path: '/outreach', icon: Send },
      ]
    },
    {
      title: 'Delivery OS',
      items: [
        { name: 'Clients', path: '/clients', icon: Users },
        { name: 'Tasks', path: '/projects/1/board', icon: CheckSquare },
        { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
        { name: 'Documents', path: '/documents', icon: Folder },
      ]
    },
    {
      title: 'Business OS',
      items: [
        { name: 'Finance', path: '/finance', icon: DollarSign },
        { name: 'Analytics', path: '/analytics/growth', icon: BarChart2 },
      ]
    },
    {
      title: 'Platform',
      items: [
        { name: 'Settings', path: '/system/audit', icon: Settings },
        { name: 'My Profile', path: '/profile', icon: User },
        { name: 'Notifications', path: '/system/notifications', icon: Bell },
      ]
    }
  ];

  if (role === 'admin') {
    groups.push({
      title: 'Admin OS',
      items: [
        { name: 'Operations', path: '/operations', icon: Zap },
      ]
    });
  }

  return groups;
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useStore(authStore);
  const navGroups = getNavGroups(user?.role_name || undefined);

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <motion.aside 
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 flex flex-col h-screen fixed top-0 left-0 p-4 pb-4 z-40 bg-transparent"
    >
      <div className="glass-panel w-full h-full rounded-3xl flex flex-col overflow-hidden border border-white/40 shadow-sm relative">
        <div className="p-5 pb-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img 
              src="/stand-transparent.png" 
              alt="AgencyOS Emblem" 
              className="w-8 h-8 object-contain shrink-0 drop-shadow-xs transition-transform group-hover:scale-105" 
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
                Agency<span className="text-indigo-600 dark:text-indigo-400">OS</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase mt-0.5 font-mono">
                AUTONOMOUS V2
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-8">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-3 mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/');
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block focus:outline-none"
                    >
                      <motion.div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                          isActive 
                            ? "text-gray-900 dark:text-gray-100 bg-white/60 dark:bg-gray-800/60 shadow-sm" 
                            : "text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-primary rounded-r-full shadow-[0_0_8px_rgba(255,183,213,0.8)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                        <item.icon className={cn("w-5 h-5", isActive ? "text-pink-400" : "text-gray-400 dark:text-gray-500 group-hover:text-pink-300")} strokeWidth={isActive ? 2.5 : 2} />
                        {item.name}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-100 transition-all"
          >
            <LogOut className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            Sign Out
          </button>
          <div className="flex items-center justify-between px-3 pt-1 text-[10px] text-gray-400 dark:text-gray-500 select-none">
            <div className="flex items-center gap-1.5">
              <img src="/stand-transparent.png" alt="AgencyOS" className="w-3.5 h-3.5 object-contain" />
              <span className="font-semibold text-gray-500 dark:text-gray-400">AgencyOS</span>
            </div>
            <span className="font-mono text-[9px] bg-white/60 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50">v2.4</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
