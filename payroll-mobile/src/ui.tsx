import {
  useColorScheme, View, Text, Pressable, ActivityIndicator, StyleSheet, Animated, Easing,
  Platform, ImageBackground,
  type ViewStyle, type TextStyle, type PressableProps, type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { gelap, terang, teks, angka, jarak, lengkung, bayangan, SENTUH, type Tema } from './theme';
import { getar } from './getar';
import { useReduceMotion } from './gerak';

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? gelap : terang;
}

const BUTIRAN = require('../assets/butiran.png');

/**
 * Tinggi bilah tab, di luar area aman.
 *
 * Header dan bilah tab keduanya tembus pandang agar isi terlihat bergulir di
 * belakangnya. Konsekuensinya isi tidak lagi otomatis diberi ruang: tanpa
 * kedua nilai di bawah ini, baris pertama tertutup judul dan baris terakhir
 * tertutup bilah tab.
 */
export const TINGGI_TAB = 74;

export function useRuangAtas() {
  const insets = useSafeAreaInsets();
  return insets.top + (Platform.OS === 'ios' ? 44 : 56);
}

export function useRuangBawah() {
  const insets = useSafeAreaInsets();
  return TINGGI_TAB + insets.bottom + jarak.lg;
}

// ───────────────────────────── substrat ─────────────────────────────

/**
 * Latar halaman: kertas dengan butiran halus.
 *
 * Permukaan digital yang benar-benar rata terbaca sebagai "dihasilkan mesin".
 * Butiran tipis di atasnya memberi kesan bahan cetak — nyaris tidak terlihat
 * satu per satu, tetapi bedanya terasa begitu dimatikan.
 */
export function Kertas({ children }: { children?: ReactNode }) {
  const t = useTema();
  return (
    <View style={{ flex: 1, backgroundColor: t.kertas }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ImageBackground
          source={BUTIRAN}
          resizeMode="repeat"
          style={StyleSheet.absoluteFill}
          imageStyle={{ opacity: t.butiran }}
        />
      </View>
      {children}
    </View>
  );
}

/**
 * Bidang terangkat.
 *
 * Dipakai hemat. Ketika semua hal diberi kotak, tidak ada yang menonjol — jadi
 * sebagian besar isi justru dipisahkan garis rambut dan ruang kosong, bukan
 * bingkai.
 */
export function Bidang({
  children, style, rapat, apung,
}: { children: ReactNode; style?: StyleProp<ViewStyle>; rapat?: boolean; apung?: boolean }) {
  const t = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: t.bidang,
          borderRadius: lengkung.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.garis,
          padding: rapat ? jarak.md : jarak.lg,
        },
        bayangan(t, apung ? 'apung' : 'tipis'),
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Bidang dengan tepi bawah berperforasi, seperti sobekan slip gaji.
 *
 * Satu-satunya hiasan berbentuk di aplikasi ini, dan hanya dipakai pada slip.
 * Bentuknya menjelaskan isinya: ini dokumen yang dirobek dari lembar yang
 * lebih besar.
 */
export function Sobekan({
  children, style,
}: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTema();
  return (
    <View style={style}>
      <View
        style={[
          {
            backgroundColor: t.bidang,
            borderTopLeftRadius: lengkung.lg,
            borderTopRightRadius: lengkung.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: 0,
            borderColor: t.garis,
            padding: jarak.lg,
          },
          bayangan(t, 'tipis'),
        ]}
      >
        {children}
      </View>

      {/* deretan takik setengah lingkaran — tepi yang tersobek */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: t.bidang,
          borderWidth: StyleSheet.hairlineWidth,
          borderTopWidth: 0,
          borderColor: t.garis,
          height: 9,
          overflow: 'hidden',
          paddingHorizontal: 3,
        }}
      >
        {Array.from({ length: 22 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 11, height: 11, borderRadius: 999,
              marginTop: 3.5, backgroundColor: t.kertas,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ───────────────────────────── teks ─────────────────────────────

/** Label kolom, seperti kepala kolom pada slip cetak. */
export function Kolom({
  children, style, atas,
}: { children: ReactNode; style?: TextStyle; atas?: boolean }) {
  const t = useTema();
  return (
    <Text style={[teks.kolom, { color: atas ? t.aksen : t.tintaPudar, textTransform: 'uppercase' }, style]}>
      {children}
    </Text>
  );
}

export function Judul({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTema();
  return <Text style={[teks.judul, { color: t.tinta }, style]}>{children}</Text>;
}

export function Kepala({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTema();
  return <Text style={[teks.kepala, { color: t.tinta }, style]}>{children}</Text>;
}

export function Badan({
  children, style, numberOfLines,
}: { children: ReactNode; style?: TextStyle; numberOfLines?: number }) {
  const t = useTema();
  return (
    <Text numberOfLines={numberOfLines} style={[teks.badan, { color: t.tintaSedang }, style]}>
      {children}
    </Text>
  );
}

/**
 * Angka rupiah besar.
 *
 * Awalan "Rp" ditulis kecil dan pudar: yang perlu dibaca lebih dulu adalah
 * angkanya, bukan satuannya. Bobot hurufnya ringan, karena ukuran sebesar ini
 * dengan huruf tebal terasa berteriak.
 */
export function Uang({
  nilai, ukuran = 'besar', warna, style,
}: { nilai: string; ukuran?: 'besar' | 'sedang'; warna?: string; style?: TextStyle }) {
  const t = useTema();
  const gaya = ukuran === 'besar' ? teks.angkaBesar : teks.angkaSedang;
  const bersih = nilai.replace(/^Rp\s*/, '');

  return (
    <Text style={[gaya, angka, { color: warna ?? t.tinta }, style]}>
      <Text
        style={{
          fontSize: gaya.fontSize * 0.42,
          fontWeight: '600',
          letterSpacing: 0.4,
          color: warna ?? t.tintaPudar,
        }}
      >
        Rp{'  '}
      </Text>
      {bersih}
    </Text>
  );
}

// ───────────────────────────── garis ─────────────────────────────

export function Garis({ tegas, style }: { tegas?: boolean; style?: ViewStyle }) {
  const t = useTema();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: tegas ? t.garisTegas : t.garis },
        style,
      ]}
    />
  );
}

/**
 * Baris buku besar: keterangan di kiri, angka di kanan, dihubungkan titik.
 *
 * Titik penghubung dipakai supaya mata bisa menyusuri dari nama ke angkanya
 * tanpa tersesat — cara yang sama dipakai daftar isi dan slip cetak.
 */
export function BarisBuku({
  kiri, kanan, tebal, warna, catatan,
}: { kiri: string; kanan: string; tebal?: boolean; warna?: string; catatan?: string }) {
  const t = useTema();
  return (
    <View style={{ paddingVertical: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: jarak.sm }}>
        <Text style={[teks.badan, { color: tebal ? t.tinta : t.tintaSedang }]} numberOfLines={1}>
          {kiri}
        </Text>
        <View
          style={{
            flex: 1, minWidth: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: t.garis,
            borderStyle: 'dotted',
            transform: [{ translateY: -3 }],
          }}
        />
        <Text style={[tebal ? teks.sedang : teks.badan, angka, { color: warna ?? t.tinta }]}>
          {kanan}
        </Text>
      </View>
      {catatan ? <Text style={[teks.kecil, { color: t.tintaPudar, marginTop: 2 }]}>{catatan}</Text> : null}
    </View>
  );
}

// ───────────────────────────── interaksi ─────────────────────────────

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
    Animated.spring(skala, { toValue: nilai, useNativeDriver: true, speed: 44, bounciness: 3 }).start();
  };

  /*
   * Gaya dari pemanggil dipasang pada Pressable, bukan pada View di dalamnya:
   * properti tata letak seperti `flex: 1` harus sampai ke elemen yang diukur
   * induknya, kalau tidak dua tombol bersebelahan menciut ke kiri.
   */
  return (
    <Pressable
      onPressIn={() => ke(0.975)}
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

/**
 * Tombol.
 *
 * Satu bentuk saja: bidang penuh berwarna tinta, sudut kecil. Tanpa gradien —
 * gradien pada tombol membuat setiap tombol tampak seperti ajakan berlangganan.
 */
export function Tombol({
  judul, onPress, jenis = 'utama', memuat, nonaktif, ikon, style,
}: {
  judul: string; onPress: () => void;
  jenis?: 'utama' | 'garis' | 'bahaya' | 'atasAksen';
  memuat?: boolean; nonaktif?: boolean; ikon?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  const mati = nonaktif || memuat;

  const latar = jenis === 'utama' ? t.tinta : jenis === 'atasAksen' ? t.aksenAtas : 'transparent';
  const warnaTeks =
    jenis === 'utama' ? t.kertas
    : jenis === 'atasAksen' ? t.aksen
    : jenis === 'bahaya' ? t.negatif
    : t.tinta;

  return (
    <Tekan
      onPress={onPress}
      disabled={mati}
      accessibilityRole="button"
      accessibilityLabel={judul}
      accessibilityState={{ disabled: Boolean(mati), busy: Boolean(memuat) }}
      style={[{ opacity: mati ? 0.45 : 1 }, style]}
    >
      <View
        style={{
          minHeight: SENTUH,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: jarak.sm, paddingHorizontal: jarak.lg,
          borderRadius: lengkung.md,
          backgroundColor: latar,
          borderWidth: jenis === 'garis' || jenis === 'bahaya' ? StyleSheet.hairlineWidth : 0,
          borderColor: jenis === 'bahaya' ? t.negatif : t.garisTegas,
        }}
      >
        {memuat ? <ActivityIndicator size="small" color={warnaTeks} /> : ikon}
        <Text style={[teks.sedang, { color: warnaTeks }]}>{judul}</Text>
      </View>
    </Tekan>
  );
}

// ───────────────────────────── status ─────────────────────────────

const RASA: Record<string, 'baik' | 'tunggu' | 'buruk'> = {
  APPROVED: 'baik', PRESENT: 'baik', PAID: 'baik', SENT: 'baik', WFH: 'baik',
  PENDING: 'tunggu', LATE: 'tunggu', HOLD: 'tunggu',
  REJECTED: 'buruk', ABSENT: 'buruk', FAILED: 'buruk',
};

const NAMA: Record<string, string> = {
  APPROVED: 'Disetujui', PENDING: 'Menunggu', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan',
  PRESENT: 'Hadir', LATE: 'Terlambat', ABSENT: 'Mangkir', LEAVE: 'Cuti',
  WFH: 'Jarak jauh', HOLIDAY: 'Libur',
  SENT: 'Terkirim', FAILED: 'Gagal', HOLD: 'Ditahan',
};

/**
 * Penanda status.
 *
 * Teks berwarna dengan garis tegak di kirinya, bukan pil berlatar. Pil membuat
 * setiap status tampak seperti tombol yang bisa ditekan. Namanya selalu
 * tertulis, jadi warna tidak pernah menjadi satu-satunya penanda.
 */
export function Status({ status, teks: label }: { status: string; teks?: string }) {
  const t = useTema();
  const rasa = RASA[status];
  const warna =
    rasa === 'baik' ? t.positif : rasa === 'tunggu' ? t.tunggu : rasa === 'buruk' ? t.negatif : t.tintaPudar;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 2, height: 12, borderRadius: 1, backgroundColor: warna }} />
      <Text style={[teks.kolom, { color: warna, textTransform: 'uppercase' }]}>
        {label ?? NAMA[status] ?? status}
      </Text>
    </View>
  );
}

// ───────────────────────────── keadaan ─────────────────────────────

export function Kosong({
  pesan, ikon = 'document-text-outline', aksi,
}: {
  pesan: string;
  ikon?: keyof typeof Ionicons.glyphMap;
  aksi?: { judul: string; onPress: () => void };
}) {
  const t = useTema();
  return (
    <Muncul>
      <View style={{ alignItems: 'center', paddingVertical: jarak.xxl, gap: jarak.lg }}>
        <Ionicons name={ikon} size={34} color={t.tintaPudar} />
        <Text style={[teks.badan, { color: t.tintaSedang, textAlign: 'center', maxWidth: 270, lineHeight: 22 }]}>
          {pesan}
        </Text>
        {aksi ? <Tombol judul={aksi.judul} jenis="garis" onPress={aksi.onPress} /> : null}
      </View>
    </Muncul>
  );
}

export function Galat({ pesan, coba }: { pesan: string; coba?: () => void }) {
  const t = useTema();
  return (
    <Kertas>
      <View style={{ flex: 1, justifyContent: 'center', padding: jarak.xl, gap: jarak.lg, alignItems: 'center' }}>
        <Ionicons name="cloud-offline-outline" size={34} color={t.tintaPudar} />
        <Text style={[teks.badan, { color: t.tintaSedang, textAlign: 'center', maxWidth: 290, lineHeight: 22 }]}>
          {pesan}
        </Text>
        {coba ? <Tombol judul="Coba lagi" jenis="garis" onPress={coba} /> : null}
      </View>
    </Kertas>
  );
}

export function Rangka({
  tinggi = 15, lebar = '100%', style,
}: { tinggi?: number; lebar?: number | string; style?: ViewStyle }) {
  const t = useTema();
  const denyut = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const gerak = Animated.loop(
      Animated.sequence([
        Animated.timing(denyut, { toValue: 0.9, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(denyut, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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
          borderRadius: lengkung.sm,
          backgroundColor: t.garis,
          opacity: denyut,
        },
        style,
      ]}
    />
  );
}

export function MemuatDaftar({ jumlah = 3 }: { jumlah?: number }) {
  const ruangAtas = useRuangAtas();
  return (
    <Kertas>
      <View style={{ padding: jarak.lg, paddingTop: ruangAtas + jarak.lg, gap: jarak.xl }}>
        <View style={{ gap: jarak.sm }}>
          <Rangka tinggi={10} lebar="26%" />
          <Rangka tinggi={38} lebar="62%" />
        </View>
        {Array.from({ length: jumlah }).map((_, i) => (
          <View key={i} style={{ gap: jarak.sm }}>
            <Rangka tinggi={13} lebar="45%" />
            <Rangka tinggi={13} lebar="88%" />
          </View>
        ))}
      </View>
    </Kertas>
  );
}

export function Muncul({
  children, jeda = 0, style,
}: { children: ReactNode; jeda?: number; style?: StyleProp<ViewStyle> }) {
  const kurangiGerak = useReduceMotion();
  const maju = useRef(new Animated.Value(kurangiGerak ? 1 : 0)).current;

  useEffect(() => {
    if (kurangiGerak) {
      maju.setValue(1);
      return;
    }
    const a = Animated.timing(maju, {
      toValue: 1, duration: 340, delay: jeda,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [maju, jeda, kurangiGerak]);

  return (
    <Animated.View
      style={[
        {
          opacity: maju,
          transform: [{ translateY: maju.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
