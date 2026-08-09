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
        {/* Topbar memakai wadah selebar isi halaman (.page). Tanpa ini
            batang atas melebar penuh sementara isi halaman terpusat,
            sehingga tepi kirinya tidak segaris dan tampilan terasa acak. */}
        <header className="sticky top-0 z-20 px-3 pt-3 lg:px-5">
          <div className="page">
            <div
              className="relative flex items-center gap-2 px-3 py-2"
              style={{ borderRadius: 14 }}
            >
              {/*
                Efek kaca dipasang sebagai lapisan anak, bukan pada bilah ini
                sendiri. Sebabnya halus tetapi mahal: `backdrop-filter`
                menjadikan elemen pemakainya containing block bagi keturunan
                berposisi `fixed`. Sidebar di bawah memakai `fixed` untuk rel
                navigasi dan laci — dan selama efek kaca menempel pada bilah,
                keduanya terjepit ke dalam kotak setinggi bilah lalu lenyap:
                rel kiri tidak pernah tergambar sementara ruang selebar 252px
                tetap disisakan untuknya, dan lapisan gelap laci hanya menutupi
                bilah atas. Sebagai saudara, tampilannya sama persis sedangkan
                `fixed` kembali mengacu ke layar.
              */}
              <div
                aria-hidden
                className="glass absolute inset-0 -z-10"
                style={{ borderRadius: 14 }}
              />
              <Sidebar
                role={session.role}
                name={session.name}
                email={session.email}
              />
              <CommandPalette role={session.role} />
              <div className="ml-auto flex items-center gap-2">
                <Notifications items={notifications} />
                <ThemeToggle compact />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-5 lg:px-5">{children}</main>

        <footer className="px-3 pb-6 lg:px-5">
          <div className="page">
            <p
              className="border-t pt-4 text-center t-micro"
              style={{ borderColor: 'var(--hairline)' }}
            >
              Racik · data demo · dibuat oleh Zainul Arkaan
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
