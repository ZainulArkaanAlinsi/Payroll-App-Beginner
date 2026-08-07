import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/components/shell/Sidebar';
import CommandPalette from '@/components/shell/CommandPalette';
import Notifications from '@/components/shell/Notifications';
import ThemeToggle from '@/components/shell/ThemeToggle';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  return (
    <div className="min-h-dvh lg:pl-[252px]">
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 px-3 pt-3 lg:px-5">
          <div className="glass flex items-center gap-2 px-3 py-2" style={{ borderRadius: 14 }}>
            {/* Sidebar memuat tombol hamburger, rel tetap, dan laci sekaligus.
                Rel & laci memakai posisi fixed, jadi tempatnya di DOM bebas. */}
            <Sidebar
              role={session.role}
              name={session.name}
              email={session.email}
              hue={session.avatarHue}
            />
            <CommandPalette role={session.role} />
            <div className="ml-auto flex items-center gap-2">
              <Notifications items={notifications} />
              <ThemeToggle compact />
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-5 lg:px-5">{children}</main>

        <footer
          className="px-5 pb-5 text-center t-micro"
          style={{ color: 'var(--text-muted)' }}
        >
          Racik · data demo · dibuat oleh Zainul Arkaan
        </footer>
      </div>
    </div>
  );
}
