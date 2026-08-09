import {
  useColorScheme, View, Text, Pressable, ActivityIndicator, StyleSheet, Animated, Easing,
  type ViewStyle, type TextStyle, type PressableProps, type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HURUF, gelap, terang, teks, tabular, jarak, lengkung, bayangan, SENTUH, type Tema } from './theme';
import { getar } from './getar';
import { useReduceMotion } from './gerak';

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? gelap : terang;
}

/** Tinggi bilah tab mengambang, di luar area aman. */
export const TINGGI_TAB = 64;

export function useRuangBawah() {
  const insets = useSafeAreaInsets();
  return TINGGI_TAB + insets.bottom + jarak.xl;
}

// ───────────────────────────── panel utama ─────────────────────────────

/**
 * Panel gelap membulat di puncak layar.
 *
 * Memegang satu angka terpenting dan tindakan yang paling sering dipakai.
 * Sudut bawahnya membulat besar sehingga lembar terang di bawahnya terbaca
 * sebagai lapisan terpisah, bukan lanjutan halaman yang sama.
 */
export function Panel({
  children, style,
}: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTema();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={t.panel}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        {
          paddingTop: insets.top + jarak.md,
          paddingHorizontal: jarak.lg,
          paddingBottom: jarak.xl,
          borderBottomLeftRadius: lengkung.xxl,
          borderBottomRightRadius: lengkung.xxl,
        },
        style,
      ]}
    >
      {/* pendar lembut di sudut kanan atas, memberi arah cahaya */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', top: -110, right: -70,
          width: 240, height: 240, borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.07)',
        }}
      />
      {children}
    </LinearGradient>
  );
}

/** Kartu abu lembut di atas lembar terang. */
export function Kartu({
  children, style, rapat, putih,
}: { children: ReactNode; style?: StyleProp<ViewStyle>; rapat?: boolean; putih?: boolean }) {
  const t = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: putih ? t.lembar : t.lembut,
          borderRadius: lengkung.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.lembutTepi,
          padding: rapat ? jarak.md : jarak.lg,
        },
        putih ? bayangan(t, 'lembut') : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Kartu bergaya struk, dengan garis putus dan takik di kedua sisi.
 *
 * Dipakai khusus untuk slip gaji. Bentuknya menjelaskan isinya: ini bukti
 * pembayaran, bukan sekadar baris daftar.
 */
export function Struk({
  atas, bawah, style,
}: { atas: ReactNode; bawah: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTema();
  return (
    <View style={[bayangan(t, 'lembut'), style]}>
      <View
        style={{
          backgroundColor: t.lembar,
          borderTopLeftRadius: lengkung.lg,
          borderTopRightRadius: lengkung.lg,
          paddingHorizontal: jarak.lg,
          paddingTop: jarak.lg,
          paddingBottom: jarak.md,
        }}
      >
        {atas}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.lembar }}>
        <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: t.latar, marginLeft: -9 }} />
        <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden', gap: 5, paddingHorizontal: 6 }}>
          {Array.from({ length: 26 }).map((_, i) => (
            <View key={i} style={{ width: 6, height: 1.5, borderRadius: 1, backgroundColor: t.garis }} />
          ))}
        </View>
        <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: t.latar, marginRight: -9 }} />
      </View>

      <View
        style={{
          backgroundColor: t.lembar,
          borderBottomLeftRadius: lengkung.lg,
          borderBottomRightRadius: lengkung.lg,
          paddingHorizontal: jarak.lg,
          paddingTop: jarak.md,
          paddingBottom: jarak.lg,
        }}
      >
        {bawah}
      </View>
    </View>
  );
}

// ───────────────────────────── teks ─────────────────────────────

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

export function Label({
  children, style, atas,
}: { children: ReactNode; style?: TextStyle; atas?: boolean }) {
  const t = useTema();
  return (
    <Text style={[teks.kecil, { color: atas ? t.panelRedup : t.tintaRedup }, style]}>
      {children}
    </Text>
  );
}

/**
 * Angka rupiah besar.
 *
 * Tiga digit terakhir diredupkan. Yang perlu ditangkap sekilas adalah besaran
 * angkanya — lima puluh juta sekian — bukan rupiah terakhirnya, dan meredupkan
 * ekornya membuat besaran itu terbaca lebih cepat.
 */
export function Saldo({
  nilai, ukuran = 'besar', warna, redup, style,
}: {
  nilai: string; ukuran?: 'besar' | 'kecil';
  warna?: string; redup?: string; style?: TextStyle;
}) {
  const t = useTema();
  const gaya = ukuran === 'besar' ? teks.saldo : teks.saldoKecil;
  const bersih = nilai.replace(/^Rp\s*/, '');
  const potong = bersih.lastIndexOf('.');
  const kepala = potong > 0 ? bersih.slice(0, potong) : bersih;
  const ekor = potong > 0 ? bersih.slice(potong) : '';

  return (
    <Text style={[gaya, tabular, { color: warna ?? t.tinta }, style]}>
      <Text style={{ fontSize: gaya.fontSize * 0.55, fontFamily: HURUF.beratI }}>Rp </Text>
      {kepala}
      {ekor ? <Text style={{ color: redup ?? t.tintaRedup }}>{ekor}</Text> : null}
    </Text>
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
    Animated.spring(skala, { toValue: nilai, useNativeDriver: true, speed: 44, bounciness: 4 }).start();
  };

  // Gaya dari pemanggil dipasang pada Pressable, bukan View di dalamnya:
  // properti tata letak seperti `flex: 1` harus sampai ke elemen yang diukur.
  return (
    <Pressable
      onPressIn={() => ke(0.96)}
      onPressOut={() => ke(1)}
      onPress={(e) => { if (getarkan) getar.ketuk(); onPress?.(e); }}
      style={style}
      {...sisa}
    >
      <Animated.View style={{ transform: [{ scale: skala }] }}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * Pil aksi di dalam panel: ikon bundar di atas, label kecil di bawahnya.
 *
 * Bentuk ini dipakai hampir semua dompet digital karena bekerja — sasaran
 * sentuhnya besar, ikonnya terbaca sekilas, dan deretannya memberi tahu apa
 * saja yang bisa dilakukan tanpa perlu menjelajah.
 */
export function PilAksi({
  ikon, label, onPress, sorot,
}: {
  ikon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  sorot?: boolean;
}) {
  const t = useTema();
  return (
    <Tekan onPress={onPress} style={{ flex: 1, alignItems: 'center' }} accessibilityLabel={label}>
      <View style={{ alignItems: 'center', gap: 7 }}>
        <View
          style={{
            width: 46, height: 46, borderRadius: lengkung.md,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: sorot ? '#ffffff' : t.panelIsian,
          }}
        >
          <Ionicons name={ikon} size={20} color={sorot ? t.panel[1] : t.panelTeks} />
        </View>
        <Text style={[teks.kecil, { color: t.panelRedup, fontSize: 11.5 }]}>{label}</Text>
      </View>
    </Tekan>
  );
}

export function Tombol({
  judul, onPress, jenis = 'utama', memuat, nonaktif, ikon, style,
}: {
  judul: string; onPress: () => void;
  jenis?: 'utama' | 'garis' | 'bahaya' | 'terang';
  memuat?: boolean; nonaktif?: boolean; ikon?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  const mati = nonaktif || memuat;

  const latar = jenis === 'utama' ? t.merek : jenis === 'terang' ? '#ffffff' : 'transparent';
  const warnaTeks =
    jenis === 'utama' ? '#ffffff'
    : jenis === 'terang' ? t.panel[1]
    : jenis === 'bahaya' ? t.turun
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
          minHeight: SENTUH + 4,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: jarak.sm, paddingHorizontal: jarak.xl,
          borderRadius: lengkung.pil,
          backgroundColor: latar,
          borderWidth: jenis === 'garis' || jenis === 'bahaya' ? 1.4 : 0,
          borderColor: jenis === 'bahaya' ? t.turun : t.garis,
        }}
      >
        {memuat ? <ActivityIndicator size="small" color={warnaTeks} /> : ikon}
        <Text style={[teks.sedang, { color: warnaTeks, fontSize: 15.5 }]}>{judul}</Text>
      </View>
    </Tekan>
  );
}

// ───────────────────────────── daftar ─────────────────────────────

/**
 * Baris daftar dengan ubin ikon di kiri.
 *
 * Ubin itu bukan hiasan: warnanya membedakan jenis catatan sekilas, dan
 * ukurannya memberi baris ini titik jangkar sehingga daftar panjang tetap
 * mudah dipindai.
 */
export function BarisDaftar({
  ikon, warna, judul, catatan, nilai, subNilai, onPress, akhir,
}: {
  ikon: keyof typeof Ionicons.glyphMap;
  warna?: string;
  judul: string;
  catatan?: string;
  nilai?: string;
  subNilai?: ReactNode;
  onPress?: () => void;
  akhir?: boolean;
}) {
  const t = useTema();
  const w = warna ?? t.merek;

  const isi = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md, paddingVertical: jarak.md }}>
      <View
        style={{
          width: 42, height: 42, borderRadius: lengkung.sm,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: t.gelap ? 'rgba(255,255,255,0.06)' : t.lembut,
        }}
      >
        <Ionicons name={ikon} size={19} color={w} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[teks.sedang, { color: t.tinta }]} numberOfLines={1}>{judul}</Text>
        {catatan ? (
          <Text style={[teks.kecil, { color: t.tintaRedup, marginTop: 2 }]} numberOfLines={1}>
            {catatan}
          </Text>
        ) : null}
      </View>

      {nilai ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[teks.sedang, tabular, { color: t.tinta }]}>{nilai}</Text>
          {subNilai ? <View style={{ marginTop: 3 }}>{subNilai}</View> : null}
        </View>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={17} color={t.tintaRedup} />
      ) : null}
    </View>
  );

  const bungkus = (
    <View style={{ borderBottomWidth: akhir ? 0 : StyleSheet.hairlineWidth, borderColor: t.garis }}>
      {isi}
    </View>
  );

  return onPress ? <Tekan onPress={onPress}>{bungkus}</Tekan> : bungkus;
}

// ───────────────────────────── status ─────────────────────────────

const RASA: Record<string, 'naik' | 'tunggu' | 'turun'> = {
  APPROVED: 'naik', PRESENT: 'naik', PAID: 'naik', SENT: 'naik', WFH: 'naik',
  PENDING: 'tunggu', LATE: 'tunggu', HOLD: 'tunggu',
  REJECTED: 'turun', ABSENT: 'turun', FAILED: 'turun',
};

const NAMA: Record<string, string> = {
  APPROVED: 'Disetujui', PENDING: 'Menunggu', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan',
  PRESENT: 'Hadir', LATE: 'Terlambat', ABSENT: 'Mangkir', LEAVE: 'Cuti',
  WFH: 'Jarak jauh', HOLIDAY: 'Libur',
  SENT: 'Terkirim', FAILED: 'Gagal', HOLD: 'Ditahan',
};

/** Lencana pil. Namanya selalu tertulis, jadi warna bukan penanda tunggal. */
export function Lencana({
  status, teks: label, ikon,
}: { status: string; teks?: string; ikon?: keyof typeof Ionicons.glyphMap }) {
  const t = useTema();
  const rasa = RASA[status];
  const warna = rasa === 'naik' ? t.naik : rasa === 'tunggu' ? t.tunggu : rasa === 'turun' ? t.turun : t.tintaRedup;
  const latar =
    rasa === 'naik' ? t.naikLembut
    : rasa === 'tunggu' ? t.tungguLembut
    : rasa === 'turun' ? t.turunLembut
    : t.lembut;

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 9, paddingVertical: 4,
        borderRadius: lengkung.pil, backgroundColor: latar, alignSelf: 'flex-start',
      }}
    >
      {ikon ? <Ionicons name={ikon} size={11} color={warna} /> : null}
      <Text style={[teks.mikro, { color: warna }]}>{label ?? NAMA[status] ?? status}</Text>
    </View>
  );
}

// ───────────────────────────── keadaan ─────────────────────────────

export function Kosong({
  pesan, ikon = 'file-tray-outline', aksi,
}: {
  pesan: string;
  ikon?: keyof typeof Ionicons.glyphMap;
  aksi?: { judul: string; onPress: () => void };
}) {
  const t = useTema();
  return (
    <Muncul>
      <View style={{ alignItems: 'center', paddingVertical: jarak.xxl, gap: jarak.lg }}>
        <View
          style={{
            width: 64, height: 64, borderRadius: lengkung.lg,
            backgroundColor: t.lembut, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={ikon} size={26} color={t.tintaRedup} />
        </View>
        <Text style={[teks.badan, { color: t.tintaSedang, textAlign: 'center', maxWidth: 270, lineHeight: 21 }]}>
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
    <View
      style={{
        flex: 1, backgroundColor: t.latar, justifyContent: 'center',
        padding: jarak.xl, gap: jarak.lg, alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 64, height: 64, borderRadius: lengkung.lg,
          backgroundColor: t.turunLembut, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="cloud-offline-outline" size={26} color={t.turun} />
      </View>
      <Text style={[teks.badan, { color: t.tintaSedang, textAlign: 'center', maxWidth: 290, lineHeight: 21 }]}>
        {pesan}
      </Text>
      {coba ? <Tombol judul="Coba lagi" jenis="garis" onPress={coba} /> : null}
    </View>
  );
}

export function Rangka({
  tinggi = 15, lebar = '100%', bulat = lengkung.sm, gelapkan, style,
}: {
  tinggi?: number; lebar?: number | string; bulat?: number;
  gelapkan?: boolean; style?: ViewStyle;
}) {
  const t = useTema();
  const denyut = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const gerak = Animated.loop(
      Animated.sequence([
        Animated.timing(denyut, { toValue: 0.95, duration: 780, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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
          backgroundColor: gelapkan ? 'rgba(255,255,255,0.14)' : t.lembut,
          opacity: denyut,
        },
        style,
      ]}
    />
  );
}

/** Keadaan muat yang meniru bentuk layar: panel gelap lalu daftar di bawahnya. */
export function MemuatLayar({ baris = 3 }: { baris?: number }) {
  const t = useTema();
  return (
    <View style={{ flex: 1, backgroundColor: t.latar }}>
      <Panel>
        <View style={{ gap: jarak.md }}>
          <Rangka tinggi={11} lebar="34%" gelapkan />
          <Rangka tinggi={34} lebar="66%" gelapkan bulat={lengkung.sm} />
          <View style={{ flexDirection: 'row', gap: jarak.md, marginTop: jarak.sm }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 7 }}>
                <Rangka tinggi={46} lebar={46} bulat={lengkung.md} gelapkan />
                <Rangka tinggi={9} lebar="70%" gelapkan />
              </View>
            ))}
          </View>
        </View>
      </Panel>

      <View style={{ padding: jarak.lg, gap: jarak.lg }}>
        {Array.from({ length: baris }).map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
            <Rangka tinggi={42} lebar={42} bulat={lengkung.sm} />
            <View style={{ flex: 1, gap: 7 }}>
              <Rangka tinggi={13} lebar="52%" />
              <Rangka tinggi={11} lebar="34%" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Memunculkan isi dengan pudar naik singkat.
 *
 * Animasinya diberi jaring pengaman yang menyetel nilai akhir secara paksa
 * setelah durasinya lewat. Alasannya ditemukan dengan cara yang pahit: ketika
 * animasi tidak pernah berjalan — penggerak asli tidak tersedia, tab tidak
 * terlihat, atau perangkat menahan pembaruan — isinya tersandera pada opacity
 * nol dan layar tampak kosong sama sekali.
 *
 * Animasi masuk tidak boleh menjadi penentu apakah isi terlihat.
 */
export function Muncul({
  children, jeda = 0, style,
}: { children: ReactNode; jeda?: number; style?: StyleProp<ViewStyle> }) {
  const kurangiGerak = useReduceMotion();
  const maju = useRef(new Animated.Value(kurangiGerak ? 1 : 0)).current;

  useEffect(() => {
    if (kurangiGerak) { maju.setValue(1); return; }

    const durasi = 330;
    const a = Animated.timing(maju, {
      toValue: 1, duration: durasi, delay: jeda,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    a.start();

    const pengaman = setTimeout(() => maju.setValue(1), jeda + durasi + 400);
    return () => {
      a.stop();
      clearTimeout(pengaman);
    };
  }, [maju, jeda, kurangiGerak]);

  return (
    <Animated.View
      style={[
        {
          opacity: maju,
          transform: [{ translateY: maju.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Judul bagian di atas lembar, dengan tautan opsional di kanan. */
export function Bagian({
  judul, aksi,
}: { judul: string; aksi?: { label: string; onPress: () => void } }) {
  const t = useTema();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: jarak.sm,
      }}
    >
      <Text style={[teks.kepala, { color: t.tinta }]}>{judul}</Text>
      {aksi ? (
        <Tekan onPress={aksi.onPress} getarkan={false}>
          <Text style={[teks.kecil, { color: t.merek, fontFamily: HURUF.beratI }]}>{aksi.label}</Text>
        </Tekan>
      ) : null}
    </View>
  );
}
