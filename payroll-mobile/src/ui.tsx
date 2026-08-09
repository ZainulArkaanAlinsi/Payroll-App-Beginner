import {
  useColorScheme, View, Text, Pressable, ActivityIndicator, StyleSheet, Animated, Easing, Platform,
  type ViewStyle, type TextStyle, type PressableProps, type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, type ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { gelap, terang, teks, jarak, lengkung, bayangan, SENTUH, type Tema } from './theme';
import { getar } from './getar';
import { useReduceMotion } from './gerak';

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? gelap : terang;
}

/**
 * Tinggi bilah tab yang mengambang, di luar area aman.
 *
 * Header dan bilah tab keduanya tembus pandang agar isi terlihat bergulir di
 * belakang kaca. Konsekuensinya, isi tidak lagi otomatis diberi ruang: tanpa
 * kedua nilai di bawah ini, baris pertama tertutup judul dan baris terakhir
 * tertutup bilah tab.
 */
export const TINGGI_TAB = 68;

/** Ruang kosong di atas isi, setinggi header tembus pandang. */
export function useRuangAtas() {
  const insets = useSafeAreaInsets();
  // Tinggi bawaan header react-navigation: 44 di iOS, 56 di tempat lain.
  return insets.top + (Platform.OS === 'ios' ? 44 : 56);
}

/** Ruang kosong di bawah isi, setinggi bilah tab yang mengambang. */
export function useRuangBawah() {
  const insets = useSafeAreaInsets();
  return TINGGI_TAB + insets.bottom + jarak.lg;
}

// ───────────────────────────── permukaan ─────────────────────────────

/**
 * Kartu biasa.
 *
 * Bayangannya berlapis: satu tipis untuk kontur, satu lebar untuk kedalaman.
 * Itu yang membedakan permukaan yang terasa terangkat dari kotak berbingkai.
 */
export function Kartu({
  children, style, rapat, datar,
}: {
  children: ReactNode; style?: ViewStyle; rapat?: boolean; datar?: boolean;
}) {
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
        datar ? null : bayangan(t, 'kartu'),
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Permukaan kaca.
 *
 * Blur sungguhan atas isi di belakangnya, bukan warna semi-transparan yang
 * meniru blur. Bedanya terasa saat permukaan ini mengambang di atas daftar
 * yang bergulir: isi di bawahnya tetap terbaca sebagai bentuk, tetapi tidak
 * bersaing dengan teks di atasnya.
 *
 * Garis kilau di tepi atas menandai arah cahaya, sama seperti di aplikasi web.
 */
export function Kaca({
  children, style, kuat = 32, bulat = lengkung.lg,
}: {
  children: ReactNode; style?: ViewStyle; kuat?: number; bulat?: number;
}) {
  const t = useTema();
  return (
    <View style={[{ borderRadius: bulat, overflow: 'hidden' }, bayangan(t, 'kartu'), style]}>
      <BlurView intensity={kuat} tint={t.gelap ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.kaca }]} />
      <View
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          backgroundColor: t.kilau,
        }}
      />
      <View
        style={{
          borderRadius: bulat,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.kacaTepi,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Kartu bergradien untuk angka utama — saldo, gaji diterima, jam absen. */
export function KartuUtama({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTema();
  return (
    <View style={[{ borderRadius: lengkung.xl, overflow: 'hidden' }, bayangan(t, 'apung'), style]}>
      <LinearGradient
        colors={t.aksenGradien}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={{ padding: jarak.xl }}
      >
        {/* kilau tipis di tepi atas, seperti permukaan kaca di web */}
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 90,
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}
        />
        {children}
      </LinearGradient>
    </View>
  );
}

// ───────────────────────────── interaksi ─────────────────────────────

/**
 * Pembungkus yang bisa ditekan, dengan penyusutan halus.
 *
 * Umpan balik seketika saat jari menyentuh, sebelum jaringan sempat menjawab —
 * inilah yang membedakan antarmuka yang terasa hidup dari yang terasa macet.
 * Menghormati pengaturan "kurangi gerak" perangkat.
 */
export function Tekan({
  children, onPress, style, getarkan = true, ...sisa
}: Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** matikan bila pemanggilnya sudah menggetarkan sendiri */
  getarkan?: boolean;
}) {
  const kurangiGerak = useReduceMotion();
  const skala = useRef(new Animated.Value(1)).current;

  const ke = (nilai: number) => {
    if (kurangiGerak) return;
    Animated.spring(skala, {
      toValue: nilai,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  /*
   * Gaya dari pemanggil dipasang pada Pressable, bukan pada View di dalamnya.
   * Kalau dipasang di dalam, properti tata letak seperti `flex: 1` tidak
   * pernah sampai ke elemen yang diukur induknya — dua tombol bersebelahan
   * akan menciut ke kiri alih-alih membagi lebar.
   */
  return (
    <Pressable
      onPressIn={() => ke(0.97)}
      onPressOut={() => ke(1)}
      onPress={(e) => {
        if (getarkan) getar.ketuk();
        onPress?.(e);
      }}
      style={style}
      {...sisa}
    >
      <Animated.View style={{ transform: [{ scale: skala }] }}>{children}</Animated.View>
    </Pressable>
  );
}

export function Tombol({
  judul, onPress, jenis = 'utama', memuat, nonaktif, ikon, style,
}: {
  judul: string; onPress: () => void; jenis?: 'utama' | 'garis' | 'bahaya' | 'kaca';
  memuat?: boolean; nonaktif?: boolean; ikon?: ReactNode; style?: ViewStyle;
}) {
  const t = useTema();
  const mati = nonaktif || memuat;

  const warnaTeks =
    jenis === 'utama' ? t.aksenTeks : jenis === 'bahaya' ? t.bahaya : jenis === 'kaca' ? '#ffffff' : t.kuat;

  const isi = (
    <View
      style={{
        minHeight: SENTUH,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: jarak.sm,
        paddingHorizontal: jarak.lg,
      }}
    >
      {memuat ? <ActivityIndicator size="small" color={warnaTeks} /> : ikon}
      <Text style={[teks.sedang, { color: warnaTeks }]}>{judul}</Text>
    </View>
  );

  const dasar: ViewStyle = { borderRadius: lengkung.md, overflow: 'hidden', opacity: mati ? 0.45 : 1 };

  return (
    <Tekan
      onPress={onPress}
      disabled={mati}
      accessibilityRole="button"
      accessibilityLabel={judul}
      accessibilityState={{ disabled: Boolean(mati), busy: Boolean(memuat) }}
      style={[dasar, style]}
    >
      {jenis === 'utama' ? (
        <LinearGradient colors={[t.aksenGradien[0], t.aksenGradien[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {isi}
        </LinearGradient>
      ) : jenis === 'kaca' ? (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', borderRadius: lengkung.md }}>
          {isi}
        </View>
      ) : (
        <View
          style={{
            borderWidth: 1,
            borderColor: jenis === 'bahaya' ? t.bahaya : t.isianTepi,
            borderRadius: lengkung.md,
            backgroundColor: jenis === 'bahaya' ? 'transparent' : t.kartu,
          }}
        >
          {isi}
        </View>
      )}
    </Tekan>
  );
}

// ───────────────────────────── teks ─────────────────────────────

export function Judul({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTema();
  return <Text style={[teks.kepala, { color: t.kuat }, style]}>{children}</Text>;
}

export function Label({ children, style, terang: putih }: { children: ReactNode; style?: TextStyle; terang?: boolean }) {
  const t = useTema();
  return (
    <Text
      style={[
        teks.mikro,
        { color: putih ? 'rgba(255,255,255,0.72)' : t.redup, textTransform: 'uppercase' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Badan({
  children, style, numberOfLines,
}: { children: ReactNode; style?: TextStyle; numberOfLines?: number }) {
  const t = useTema();
  return (
    <Text numberOfLines={numberOfLines} style={[teks.badan, { color: t.badan }, style]}>
      {children}
    </Text>
  );
}

// ───────────────────────────── status ─────────────────────────────

const RASA: Record<string, 'baik' | 'awas' | 'buruk' | 'netral'> = {
  APPROVED: 'baik', PRESENT: 'baik', PAID: 'baik', SENT: 'baik', WFH: 'baik',
  PENDING: 'awas', LATE: 'awas', HOLD: 'awas',
  REJECTED: 'buruk', ABSENT: 'buruk', FAILED: 'buruk',
};

const NAMA: Record<string, string> = {
  APPROVED: 'Disetujui', PENDING: 'Menunggu', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan',
  PRESENT: 'Hadir', LATE: 'Terlambat', ABSENT: 'Mangkir', LEAVE: 'Cuti',
  WFH: 'Kerja jarak jauh', HOLIDAY: 'Libur',
  SENT: 'Terkirim', FAILED: 'Gagal', HOLD: 'Ditahan',
};

export function Lencana({ status, teks: label }: { status: string; teks?: string }) {
  const t = useTema();
  const rasa = RASA[status] ?? 'netral';
  const warna = rasa === 'baik' ? t.aksen : rasa === 'awas' ? t.peringatan : rasa === 'buruk' ? t.bahaya : t.redup;
  const latar =
    rasa === 'baik' ? t.aksenLembut : rasa === 'awas' ? t.peringatanLembut : rasa === 'buruk' ? t.bahayaLembut : t.isian;

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 9, paddingVertical: 4.5,
        borderRadius: lengkung.penuh, backgroundColor: latar, alignSelf: 'flex-start',
      }}
    >
      {/* titik kecil sebagai penanda kedua — warna tidak pernah sendirian */}
      <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: warna }} />
      <Text style={[teks.mikro, { color: warna, textTransform: 'none', letterSpacing: 0.1 }]}>
        {label ?? NAMA[status] ?? status}
      </Text>
    </View>
  );
}

// ───────────────────────────── keadaan ─────────────────────────────

/**
 * Keadaan kosong.
 *
 * Bukan sekadar memberi tahu bahwa tidak ada data, melainkan mengatakan
 * langkah berikutnya. Layar kosong yang hanya berbunyi "belum ada data"
 * membuat orang mengira aplikasinya rusak.
 */
export function Kosong({
  pesan, ikon = 'file-tray-outline', aksi, anak,
}: {
  pesan: string;
  ikon?: keyof typeof Ionicons.glyphMap;
  aksi?: { judul: string; onPress: () => void };
  anak?: ReactNode;
}) {
  const t = useTema();
  return (
    <Muncul>
      <View style={{ alignItems: 'center', paddingVertical: jarak.xxl * 1.1, gap: jarak.md }}>
        <View
          style={{
            width: 62, height: 62, borderRadius: 999,
            backgroundColor: t.aksenLembut,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={ikon} size={27} color={t.aksen} />
        </View>
        <Text style={[teks.badan, { color: t.redup, textAlign: 'center', maxWidth: 280, lineHeight: 21 }]}>
          {pesan}
        </Text>
        {aksi ? <Tombol judul={aksi.judul} jenis="garis" onPress={aksi.onPress} /> : null}
        {anak}
      </View>
    </Muncul>
  );
}

export function Galat({ pesan, coba }: { pesan: string; coba?: () => void }) {
  const t = useTema();
  return (
    <View style={{ padding: jarak.lg, paddingTop: jarak.xxl, gap: jarak.md, alignItems: 'center' }}>
      <View
        style={{
          width: 62, height: 62, borderRadius: 999, backgroundColor: t.bahayaLembut,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="cloud-offline-outline" size={27} color={t.bahaya} />
      </View>
      <Text style={[teks.badan, { color: t.badan, textAlign: 'center', maxWidth: 290, lineHeight: 21 }]}>
        {pesan}
      </Text>
      {coba ? <Tombol judul="Coba lagi" jenis="garis" onPress={coba} /> : null}
    </View>
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

/**
 * Rangka muat.
 *
 * Lebih baik daripada lingkaran berputar karena bentuknya sudah menyerupai isi
 * yang akan datang: tata letaknya tidak melompat begitu data tiba, dan layar
 * terasa lebih cepat meski waktunya sama.
 */
export function Rangka({
  tinggi = 16, lebar = '100%', bulat = lengkung.sm, style,
}: { tinggi?: number; lebar?: number | string; bulat?: number; style?: ViewStyle }) {
  const t = useTema();
  const denyut = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const gerak = Animated.loop(
      Animated.sequence([
        Animated.timing(denyut, { toValue: 1, duration: 780, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(denyut, { toValue: 0.45, duration: 780, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    gerak.start();
    return () => gerak.stop();
  }, [denyut]);

  return (
    <Animated.View
      style={[
        {
          height: tinggi,
          width: lebar as ViewStyle['width'],
          borderRadius: bulat,
          backgroundColor: t.isian,
          opacity: denyut,
        },
        style,
      ]}
    />
  );
}

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

export function MemuatDaftar({ jumlah = 3, baris = 3 }: { jumlah?: number; baris?: number }) {
  return (
    <View style={{ padding: jarak.lg, gap: jarak.md }}>
      {Array.from({ length: jumlah }).map((_, i) => (
        <RangkaKartu key={i} baris={baris} />
      ))}
    </View>
  );
}

/**
 * Memunculkan isi dengan pudar naik singkat.
 *
 * Menghormati pengaturan "kurangi gerak" perangkat: bagi yang sensitif
 * terhadap gerakan, antarmuka yang bergerak bisa memicu pusing, jadi di sana
 * isinya langsung tampil tanpa animasi.
 */
export function Muncul({
  children, jeda = 0, style,
}: { children: ReactNode; jeda?: number; style?: ViewStyle }) {
  const kurangiGerak = useReduceMotion();
  const maju = useRef(new Animated.Value(kurangiGerak ? 1 : 0)).current;

  useEffect(() => {
    if (kurangiGerak) {
      maju.setValue(1);
      return;
    }
    const a = Animated.timing(maju, {
      toValue: 1,
      duration: 300,
      delay: jeda,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [maju, jeda, kurangiGerak]);

  return (
    <Animated.View
      style={[
        {
          opacity: maju,
          transform: [{ translateY: maju.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ───────────────────────────── tata letak ─────────────────────────────

/** Sebaris label kiri, nilai kanan — dipakai di slip dan profil. */
export function Baris({
  kiri, kanan, tebal, warna, catatan,
}: { kiri: string; kanan: string; tebal?: boolean; warna?: string; catatan?: string }) {
  const t = useTema();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: jarak.md, paddingVertical: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[teks.badan, { color: t.redup }]}>{kiri}</Text>
        {catatan ? <Text style={[teks.mikro, { color: t.redup, textTransform: 'none', marginTop: 2 }]}>{catatan}</Text> : null}
      </View>
      <Text
        style={[
          tebal ? teks.sedang : teks.badan,
          { color: warna ?? t.kuat, textAlign: 'right', fontVariant: ['tabular-nums'] },
        ]}
      >
        {kanan}
      </Text>
    </View>
  );
}

export function Garis() {
  const t = useTema();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.kartuTepi, marginVertical: 2 }} />;
}

/** Latar halaman bergradien halus, dipasang di belakang setiap layar. */
export function LatarHalaman() {
  const t = useTema();
  return (
    <LinearGradient
      colors={t.bgGradien}
      style={StyleSheet.absoluteFill}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      pointerEvents="none"
    />
  );
}
