import {
  useColorScheme, View, Text, Pressable, ActivityIndicator, StyleSheet, Animated, Easing,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { gelap, terang, teks, jarak, lengkung, type Tema } from './theme';
import { getar } from './getar';
import { useReduceMotion } from './gerak';

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? gelap : terang;
}

export function Kartu({ children, style, rapat }: { children: ReactNode; style?: ViewStyle; rapat?: boolean }) {
  const t = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: t.kartu,
          borderRadius: lengkung.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.kartuTepi,
          padding: rapat ? jarak.md : jarak.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Judul({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTema();
  return <Text style={[teks.kepala, { color: t.kuat }, style]}>{children}</Text>;
}

export function Label({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTema();
  return <Text style={[teks.mikro, { color: t.redup, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

export function Badan({ children, style, numberOfLines }: { children: ReactNode; style?: TextStyle; numberOfLines?: number }) {
  const t = useTema();
  return <Text numberOfLines={numberOfLines} style={[teks.badan, { color: t.badan }, style]}>{children}</Text>;
}

export function Tombol({
  judul, onPress, jenis = 'utama', memuat, nonaktif, ikon, style,
}: {
  judul: string; onPress: () => void; jenis?: 'utama' | 'garis' | 'bahaya';
  memuat?: boolean; nonaktif?: boolean; ikon?: ReactNode; style?: ViewStyle;
}) {
  const t = useTema();
  const mati = nonaktif || memuat;

  const latar = jenis === 'utama' ? t.aksen : 'transparent';
  const warnaTeks = jenis === 'utama' ? t.aksenTeks : jenis === 'bahaya' ? t.bahaya : t.kuat;
  const tepi = jenis === 'utama' ? t.aksen : jenis === 'bahaya' ? t.bahaya : t.isianTepi;

  return (
    <Pressable
      onPress={() => {
        getar.ketuk();
        onPress();
      }}
      disabled={mati}
      accessibilityRole="button"
      accessibilityLabel={judul}
      accessibilityState={{ disabled: Boolean(mati), busy: Boolean(memuat) }}
      // Sasaran sentuh minimal 48px — jempol tidak sepresisi tetikus.
      style={({ pressed }) => [
        {
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: jarak.sm,
          paddingHorizontal: jarak.lg,
          borderRadius: lengkung.md,
          borderWidth: 1,
          backgroundColor: latar,
          borderColor: tepi,
          opacity: mati ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {memuat ? <ActivityIndicator size="small" color={warnaTeks} /> : ikon}
      <Text style={[teks.sedang, { color: warnaTeks }]}>{judul}</Text>
    </Pressable>
  );
}

const WARNA_STATUS: Record<string, 'baik' | 'awas' | 'buruk' | 'netral'> = {
  APPROVED: 'baik', PRESENT: 'baik', PAID: 'baik', SENT: 'baik', WFH: 'baik',
  PENDING: 'awas', LATE: 'awas', HOLD: 'awas',
  REJECTED: 'buruk', ABSENT: 'buruk', FAILED: 'buruk',
};

const TEKS_STATUS: Record<string, string> = {
  APPROVED: 'Disetujui', PENDING: 'Menunggu', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan',
  PRESENT: 'Hadir', LATE: 'Terlambat', ABSENT: 'Mangkir', LEAVE: 'Cuti', WFH: 'Kerja jarak jauh', HOLIDAY: 'Libur',
  SENT: 'Terkirim', FAILED: 'Gagal', HOLD: 'Ditahan',
};

export function Lencana({ status, teks: label }: { status: string; teks?: string }) {
  const t = useTema();
  const rasa = WARNA_STATUS[status] ?? 'netral';
  const warna =
    rasa === 'baik' ? t.aksen : rasa === 'awas' ? t.peringatan : rasa === 'buruk' ? t.bahaya : t.redup;
  const latar =
    rasa === 'baik' ? t.aksenLembut : rasa === 'awas' ? t.peringatanLembut : rasa === 'buruk' ? t.bahayaLembut : t.isian;

  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: latar, alignSelf: 'flex-start' }}>
      {/* Warna tidak pernah jadi satu-satunya penanda — teksnya selalu ada. */}
      <Text style={[teks.mikro, { color: warna }]}>{label ?? TEKS_STATUS[status] ?? status}</Text>
    </View>
  );
}

export function Kosong({
  pesan, ikon = 'file-tray-outline', anak,
}: {
  pesan: string; ikon?: keyof typeof Ionicons.glyphMap; anak?: ReactNode;
}) {
  const t = useTema();
  return (
    <Muncul>
      <View style={{ alignItems: 'center', paddingVertical: jarak.xxl * 1.2, gap: jarak.md }}>
        <View style={{
          width: 52, height: 52, borderRadius: 999, backgroundColor: t.isian,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={ikon} size={24} color={t.redup} />
        </View>
        <Text style={[teks.badan, { color: t.redup, textAlign: 'center', maxWidth: 260 }]}>{pesan}</Text>
        {anak}
      </View>
    </Muncul>
  );
}

/**
 * Rangka muat.
 *
 * Lebih baik daripada lingkaran berputar karena bentuknya sudah menyerupai isi
 * yang akan datang, sehingga tata letaknya tidak melompat begitu data tiba —
 * dan layar terasa lebih cepat meski waktunya sama.
 */
export function Rangka({ tinggi = 16, lebar = '100%', bulat = lengkung.sm, style }: {
  tinggi?: number; lebar?: number | string; bulat?: number; style?: ViewStyle;
}) {
  const t = useTema();
  const denyut = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const gerak = Animated.loop(
      Animated.sequence([
        Animated.timing(denyut, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(denyut, { toValue: 0.4, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    gerak.start();
    return () => gerak.stop();
  }, [denyut]);

  return (
    <Animated.View
      style={[
        { height: tinggi, width: lebar as ViewStyle['width'], borderRadius: bulat, backgroundColor: t.isian, opacity: denyut },
        style,
      ]}
    />
  );
}

/** Rangka berbentuk kartu, dipakai saat daftar sedang dimuat. */
export function RangkaKartu({ baris = 3 }: { baris?: number }) {
  return (
    <Kartu>
      <Rangka tinggi={11} lebar="35%" />
      <View style={{ height: jarak.md }} />
      {Array.from({ length: baris }).map((_, i) => (
        <View key={i} style={{ marginTop: i === 0 ? 0 : jarak.sm }}>
          <Rangka tinggi={14} lebar={i === baris - 1 ? '55%' : '100%'} />
        </View>
      ))}
    </Kartu>
  );
}

/**
 * Memunculkan isi dengan pudar naik singkat.
 *
 * Menghormati pengaturan "kurangi gerak" perangkat: bagi yang sensitif
 * terhadap gerakan, animasi antarmuka bisa memicu pusing, jadi di sana isinya
 * langsung tampil tanpa bergerak.
 */
export function Muncul({ children, jeda = 0, style }: { children: ReactNode; jeda?: number; style?: ViewStyle }) {
  const kurangiGerak = useReduceMotion();
  const maju = useRef(new Animated.Value(kurangiGerak ? 1 : 0)).current;

  useEffect(() => {
    if (kurangiGerak) {
      maju.setValue(1);
      return;
    }
    const a = Animated.timing(maju, {
      toValue: 1, duration: 260, delay: jeda,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [maju, jeda, kurangiGerak]);

  return (
    <Animated.View
      style={[
        { opacity: maju, transform: [{ translateY: maju.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function Memuat() {
  const t = useTema();
  return (
    <View style={{ paddingVertical: jarak.xxl * 1.5, alignItems: 'center' }}>
      <ActivityIndicator color={t.aksen} />
    </View>
  );
}

/** Daftar rangka, dipakai sebagai keadaan muat pada layar berisi daftar. */
export function MemuatDaftar({ jumlah = 3, baris = 3 }: { jumlah?: number; baris?: number }) {
  return (
    <View style={{ padding: jarak.lg, gap: jarak.md }}>
      {Array.from({ length: jumlah }).map((_, i) => (
        <RangkaKartu key={i} baris={baris} />
      ))}
    </View>
  );
}

export function Galat({ pesan, coba }: { pesan: string; coba?: () => void }) {
  const t = useTema();
  return (
    <View style={{ padding: jarak.lg, gap: jarak.md, alignItems: 'center', paddingTop: jarak.xxl }}>
      <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.bahayaLembut, width: '100%' }}>
        <Text style={[teks.badan, { color: t.bahaya, textAlign: 'center' }]}>{pesan}</Text>
      </View>
      {coba ? <Tombol judul="Coba lagi" jenis="garis" onPress={coba} /> : null}
    </View>
  );
}

/** Sebaris label kiri, nilai kanan — dipakai di slip dan profil. */
export function Baris({ kiri, kanan, tebal, warna }: { kiri: string; kanan: string; tebal?: boolean; warna?: string }) {
  const t = useTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: jarak.md, paddingVertical: 7 }}>
      <Text style={[teks.badan, { color: t.redup, flex: 1 }]}>{kiri}</Text>
      <Text style={[tebal ? teks.sedang : teks.badan, { color: warna ?? t.kuat, textAlign: 'right' }]}>{kanan}</Text>
    </View>
  );
}

export function Garis() {
  const t = useTema();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.kartuTepi, marginVertical: jarak.sm }} />;
}
