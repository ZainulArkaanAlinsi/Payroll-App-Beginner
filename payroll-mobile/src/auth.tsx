import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type Pengguna } from './api';
import { bacaToken, hapusToken, simpanToken } from './storage';

interface Sesi {
  pengguna: Pengguna | null;
  memuat: boolean;
  masuk: (email: string, sandi: string) => Promise<void>;
  keluar: () => Promise<void>;
}

const Konteks = createContext<Sesi | null>(null);

export function PenyediaSesi({ children }: { children: ReactNode }) {
  const [pengguna, setPengguna] = useState<Pengguna | null>(null);
  const [memuat, setMemuat] = useState(true);

  // Saat aplikasi dibuka, token yang tersimpan diuji ke server — bukan sekadar
  // dianggap sah. Token bisa sudah kedaluwarsa atau akunnya sudah dinonaktifkan.
  useEffect(() => {
    (async () => {
      try {
        if (await bacaToken()) {
          const d = await api.saya();
          setPengguna({
            userId: '', email: d.profil.email, name: d.profil.fullName,
            role: 'EMPLOYEE', employeeId: d.profil.id, avatarHue: 160,
          });
        }
      } catch {
        await hapusToken();
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  const masuk = useCallback(async (email: string, sandi: string) => {
    const { token, user } = await api.masuk(email, sandi);
    await simpanToken(token);
    setPengguna(user);
  }, []);

  const keluar = useCallback(async () => {
    await hapusToken();
    setPengguna(null);
  }, []);

  const nilai = useMemo(() => ({ pengguna, memuat, masuk, keluar }), [pengguna, memuat, masuk, keluar]);
  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useSesi() {
  const s = useContext(Konteks);
  if (!s) throw new Error('useSesi harus dipakai di dalam PenyediaSesi');
  return s;
}
