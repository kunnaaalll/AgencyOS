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
        <main className="flex-1 px-6 py-4 w-full overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
