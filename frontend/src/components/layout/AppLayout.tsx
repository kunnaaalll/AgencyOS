import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CommandPalette } from '@/components/ui/CommandPalette'


export function AppLayout() {
  return (
    <div className="flex h-screen w-screen bg-[var(--background)] text-[var(--foreground)] font-sans relative overflow-hidden transition-colors duration-300">
      <Sidebar />
      <CommandPalette />
      <div className="flex-1 flex flex-col pl-64 w-full h-screen overflow-hidden">
        <Header />
        <main className="flex-1 px-6 py-4 w-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* Universal System Branding Footer */}
          <footer className="mt-8 pt-4 pb-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 gap-2 select-none shrink-0">
            <div className="flex items-center gap-2">
              <img src="/stand-transparent.png" alt="AgencyOS Emblem" className="w-4 h-4 object-contain" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">AgencyOS</span>
              <span>•</span>
              <span>Autonomous Growth & Operations Infrastructure</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                24/7 Engine Active
              </span>
              <span>•</span>
              <span className="font-mono text-[10px]">v2.4.0</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
