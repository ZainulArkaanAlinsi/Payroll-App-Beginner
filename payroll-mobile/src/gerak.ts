/**
 * Membaca pengaturan "kurangi gerak" milik perangkat.
 *
 * Bagi sebagian orang, antarmuka yang bergerak memicu pusing dan mual. Sistem
 * operasi sudah menyediakan pengaturannya; yang perlu dilakukan aplikasi hanya
 * mematuhinya. Nilainya bisa berubah saat aplikasi berjalan, jadi ikut
 * didengarkan, bukan hanya dibaca sekali di awal.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion() {
  const [kurangi, setKurangi] = useState(false);

  useEffect(() => {
    let hidup = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { if (hidup) setKurangi(v); })
      .catch(() => {});

    const langganan = AccessibilityInfo.addEventListener('reduceMotionChanged', setKurangi);
    return () => {
      hidup = false;
      langganan.remove();
    };
  }, []);

  return kurangi;
}
