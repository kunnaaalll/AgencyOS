import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Home, Users, Target, DollarSign, Settings } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden"
          >
            <Command className="w-full text-gray-900 dark:text-gray-100" label="Global Command Menu">
              <div className="flex items-center border-b border-white/40 dark:border-white/10 px-4 py-3 bg-white/40 dark:bg-gray-900/40">
                <Search className="w-5 h-5 text-pink-400 mr-3 shrink-0" />
                <Command.Input 
                  autoFocus 
                  placeholder="Search anything..." 
                  className="w-full bg-transparent outline-none border-none text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2 no-scrollbar">
                <Command.Empty className="py-6 text-center text-gray-500 text-sm">No results found.</Command.Empty>
                
                <Command.Group heading="Suggestions" className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2 mb-1">
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate({ to: '/dashboard' }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 aria-selected:bg-white/60 dark:aria-selected:bg-gray-800/60 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors mb-1"
                  >
                    <Home className="w-4 h-4 text-gray-400" />
                    Go to Dashboard
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate({ to: '/leads' }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 aria-selected:bg-white/60 dark:aria-selected:bg-gray-800/60 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors mb-1"
                  >
                    <Target className="w-4 h-4 text-gray-400" />
                    View Leads
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate({ to: '/clients' }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 aria-selected:bg-white/60 dark:aria-selected:bg-gray-800/60 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors mb-1"
                  >
                    <Users className="w-4 h-4 text-gray-400" />
                    Manage Clients
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings" className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2 mb-1">
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate({ to: '/finance' }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 aria-selected:bg-white/60 dark:aria-selected:bg-gray-800/60 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors mb-1"
                  >
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    Finance OS
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate({ to: '/system/monitor' }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 aria-selected:bg-white/60 dark:aria-selected:bg-gray-800/60 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors mb-1"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    System Monitor
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
