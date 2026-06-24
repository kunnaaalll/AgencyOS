import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CommandPalette } from '@/components/ui/CommandPalette'


export function AppLayout() {
  return (
      <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans relative transition-colors duration-300">
      <Sidebar />
      <CommandPalette />
      <div className="flex-1 flex flex-col pl-64 w-full min-h-screen">
        <Header />
        <main className="flex-1 px-8 pb-12 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
