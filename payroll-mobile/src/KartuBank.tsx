import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTema } from './ui';
import { bayangan, lengkung, jarak, tabular } from './theme';

/**
 * Kartu rekening gaji.
 *
 * Bukan hiasan. Yang tergambar adalah rekening yang benar-benar dipakai
 * perusahaan untuk mentransfer gaji orang ini — nama bank, empat digit
 * terakhir, dan nama pemiliknya diambil dari data karyawan yang sama dengan
 * yang dipakai berkas transfer bank. Begitu HRD mengubah nomor rekeningnya,
 * kartu ini ikut berubah.
 *
 * Itu sebabnya kartunya layak dibuat semirip mungkin dengan kartu sungguhan:
 * karyawan bisa mencocokkan empat digit terakhir dengan kartu di dompetnya
 * sendiri, dan langsung tahu kalau yang tercatat HRD keliru — sebelum gajinya
 * salah kirim, bukan sesudah.
 */

/**
 * Warna bank Indonesia.
 *
 * Diambil dari identitas masing-masing bank supaya karyawan mengenalinya
 * sekilas tanpa membaca namanya. Bank yang tidak dikenal jatuh ke kelabu
 * netral, bukan warna asal — kartu berwarna acak justru menyesatkan.
 */
const WARNA: Record<string, GayaBank> = {
  BCA: { gradien: ['#1e5fa8', '#0b3566'], teks: '#ffffff' },
  BNI: { gradien: ['#f2762e', '#b8451a'], teks: '#ffffff' },
  BRI: { gradien: ['#1560a8', '#0a3a68'], teks: '#ffffff' },
  'BANK MANDIRI': { gradien: ['#1b4f8f', '#06264e'], teks: '#ffffff', nama: 'mandiri' },
  MANDIRI: { gradien: ['#1b4f8f', '#06264e'], teks: '#ffffff', nama: 'mandiri' },
  'BANK JAGO': { gradien: ['#f5a623', '#c2760a'], teks: '#1a1204', nama: 'jago' },
  JAGO: { gradien: ['#f5a623', '#c2760a'], teks: '#1a1204', nama: 'jago' },
  'CIMB NIAGA': { gradien: ['#9d2235', '#5c0f1c'], teks: '#ffffff', nama: 'CIMB Niaga' },
  BSI: { gradien: ['#00857e', '#00514d'], teks: '#ffffff' },
  PERMATA: { gradien: ['#0a4d8c', '#052a4d'], teks: '#ffffff' },
};

type GayaBank = { gradien: [string, string]; teks: string; nama?: string };

const NETRAL: GayaBank = { gradien: ['#3d444f', '#1b1f26'], teks: '#ffffff' };

function gaya(bank: string | null | undefined): GayaBank {
  if (!bank) return NETRAL;
  return WARNA[bank.trim().toUpperCase()] ?? NETRAL;
}

/** Nomor rekening bergaya kartu: hanya empat digit terakhir yang terbaca. */
function samarkan(nomor: string | null | undefined) {
  const angka = (nomor ?? '').replace(/\D/g, '');
  if (!angka) return '•••• •••• •••• ••••';
  const ekor = angka.slice(-4);
  return `•••• •••• •••• ${ekor}`;
}

/** Cip emas, digambar dari bentuk sederhana — bukan gambar yang perlu diunduh. */
function Cip({ warna }: { warna: string }) {
  return (
    <View
      style={{
        width: 42,
        height: 32,
        borderRadius: 6,
        backgroundColor: warna,
        overflow: 'hidden',
        justifyContent: 'center',
        gap: 3,
        paddingHorizontal: 5,
      }}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      ))}
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: 4,
          bottom: 4,
          width: StyleSheet.hairlineWidth,
          backgroundColor: 'rgba(0,0,0,0.35)',
        }}
      />
    </View>
  );
}

export function KartuBank({
  bank,
  nomor,
  pemilik,
  label = 'Rekening gaji',
  style,
  kecil,
}: {
  bank: string | null | undefined;
  nomor: string | null | undefined;
  pemilik: string | null | undefined;
  label?: string;
  style?: StyleProp<ViewStyle>;
  kecil?: boolean;
}) {
  const t = useTema();
  const g = gaya(bank);
  const terang = g.teks === '#ffffff';
  const redup = terang ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.55)';
  const belumDiisi = !nomor?.trim();

  return (
    <View
      style={[
        {
          borderRadius: lengkung.xl,
          overflow: 'hidden',
          // Perbandingan sisi kartu ISO/IEC 7810 ID-1 — ukuran kartu sungguhan.
          aspectRatio: 1.586,
        },
        bayangan(t, 'apung'),
        style,
      ]}
    >
      <LinearGradient
        colors={g.gradien}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, padding: kecil ? jarak.md : jarak.lg, justifyContent: 'space-between' }}
      >
        {/* pendar lembut, meniru pantulan cahaya pada permukaan kartu */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -80,
            right: -50,
            width: 190,
            height: 190,
            borderRadius: 999,
            backgroundColor: terang ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.22)',
          }}
        />

        {/* baris atas: nama bank dan keterangan kartu */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text
              style={{
                color: g.teks,
                fontSize: kecil ? 15 : 17,
                fontWeight: '800',
                letterSpacing: -0.3,
              }}
            >
              {g.nama ?? bank ?? 'Belum diisi'}
            </Text>
            <Text style={{ color: redup, fontSize: 9, letterSpacing: 1.4, marginTop: 1 }}>
              {label.toUpperCase()}
            </Text>
          </View>

          {/* lambang nirsentuh */}
          <View style={{ transform: [{ rotate: '90deg' }], opacity: 0.75 }}>
            <Ionicons name="wifi" size={kecil ? 17 : 20} color={g.teks} />
          </View>
        </View>

        {/* cip */}
        <Cip warna={terang ? '#d8c48a' : 'rgba(255,255,255,0.75)'} />

        {/* nomor dan pemilik */}
        <View>
          <Text
            style={[
              tabular,
              {
                color: g.teks,
                fontSize: kecil ? 14 : 17,
                letterSpacing: kecil ? 1.6 : 2.4,
                fontWeight: '600',
              },
            ]}
          >
            {samarkan(nomor)}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              color: redup,
              fontSize: kecil ? 9.5 : 11,
              letterSpacing: 1.1,
              marginTop: kecil ? 4 : 7,
            }}
          >
            {(pemilik ?? 'NAMA BELUM DIISI').toUpperCase()}
          </Text>
        </View>

        {/* Rekening kosong berarti gaji tidak bisa ditransfer. Ditandai di
            kartunya sendiri, bukan hanya di daftar HRD. */}
        {belumDiisi ? (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.42)',
            }}
          >
            <Ionicons name="alert-circle" size={22} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700', marginTop: 6 }}>
              Rekening belum diisi
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10.5, marginTop: 2 }}>
              Hubungi HRD sebelum tanggal gajian
            </Text>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}
