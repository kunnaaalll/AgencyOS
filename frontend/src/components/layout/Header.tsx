import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, User, Command } from 'lucide-react';

export function Header() {


  const openCmdK = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };
  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-20 flex items-center justify-between px-8 sticky top-0 z-30 mb-8 pt-4"
    >
      <div className="flex items-center">
        {/* Breadcrumbs could go here, omitting for simplicity or making it abstract */}
        <div className="text-gray-500 font-medium text-sm">
          Overview / <span className="text-gray-900 font-semibold">Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar / Command Palette Trigger */}
        <div 
          onClick={openCmdK}
          className="glass-panel flex items-center gap-3 px-4 py-2 rounded-2xl cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all border border-white/40 dark:border-white/10 text-gray-500 dark:text-gray-400 w-64 shadow-sm group"
        >
          <Search className="w-4 h-4 text-gray-400 group-hover:text-pink-400 transition-colors" />
          <span className="text-sm font-medium flex-1">Search anything...</span>
          <div className="flex items-center gap-1 text-xs font-semibold bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-lg border border-white/60 dark:border-white/10">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button className="glass-panel w-10 h-10 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all shadow-sm">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Profile */}
        <div className="glass-panel p-1 pr-4 rounded-2xl flex items-center gap-3 shadow-sm hover:bg-white/60 transition-all cursor-pointer border border-white/40">
          <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center text-gray-800 font-bold text-sm shadow-inner">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 leading-tight">Admin User</span>
            <span className="text-xs text-gray-500 font-medium">Founder</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
