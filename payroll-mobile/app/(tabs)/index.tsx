import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type Beranda } from '../../src/api';
import { jam, namaPeriode, rupiah, salam, tanggal, tanggalPanjang } from '../../src/format';
import {
  Badan, Galat, Judul, Kartu, KartuUtama, Kosong, Label, Lencana,
  MemuatDaftar, Muncul, Tekan, Tombol, useRuangAtas, useRuangBawah, useTema,
} from '../../src/ui';
import { getar } from '../../src/getar';
import { angka, jarak, lengkung, teks } from '../../src/theme';

export default function LayarBeranda() {
  const t = useTema();
  const ruangAtas = useRuangAtas();
  const ruangBawah = useRuangBawah();
  const router = useRouter();

  const [data, setData] = useState<Beranda | null>(null);
  const [galat, setGalat] = useState('');
  const [segar, setSegar] = useState(false);
  const [absenSibuk, setAbsenSibuk] = useState(false);
  const [sekarang, setSekarang] = useState(new Date());

  const muat = useCallback(async () => {
    try {
      setData(await api.saya());
      setGalat('');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.');
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  // Jam berjalan pada kartu absen — supaya jelas bahwa waktu yang dipakai
  // adalah waktu sekarang, bukan tampilan yang membeku.
  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(useCallback(() => { muat(); }, [muat]));

  async function absen(kind: 'IN' | 'OUT') {
    setAbsenSibuk(true);
    try {
      const hasil = await api.absen(kind);
      setData((d) => (d ? { ...d, hariIni: hasil.hariIni } : d));
      getar.berhasil();
      Alert.alert(kind === 'IN' ? 'Absen masuk' : 'Absen pulang', hasil.pesan);
    } catch (e) {
      getar.gagal();
      Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Coba lagi.');
    } finally {
      setAbsenSibuk(false);
    }
  }

  /**
   * Absen pulang dikonfirmasi lebih dulu, absen masuk tidak.
   *
   * Masuk kepagian tidak merugikan, tetapi pulang yang terlanjur tercatat
   * memotong jam kerja hari itu dan hanya bisa diperbaiki lewat HRD.
   */
  function mintaPulang() {
    Alert.alert(
      'Absen pulang sekarang?',
      'Jam pulang akan tercatat dan tidak bisa Anda ubah sendiri.',
      [
        { text: 'Belum', style: 'cancel' },
        { text: 'Absen pulang', onPress: () => absen('OUT') },
      ],
    );
  }

  if (galat && !data) return <Galat pesan={galat} coba={muat} />;
  if (!data) return <MemuatDaftar jumlah={3} baris={4} />;

  const { profil, hariIni, kuotaCuti, slipTerakhir, tertunda, kehadiranBulanIni } = data;
  const hadir = (kehadiranBulanIni.PRESENT ?? 0) + (kehadiranBulanIni.WFH ?? 0) + (kehadiranBulanIni.LATE ?? 0);
  const tertundaTotal = tertunda.cuti + tertunda.lembur;
  const inisial = profil.fullName.split(' ').slice(0, 2).map((x) => x[0]).join('');

  return (
    <ScrollView
      contentContainerStyle={{
        padding: jarak.lg,
        paddingTop: ruangAtas + jarak.md,
        paddingBottom: ruangBawah,
        gap: jarak.md,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={segar}
          onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
          tintColor={t.aksen}
        />
      }
    >
      {/* ── sapaan ── */}
      <Muncul>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
          <View style={{ flex: 1 }}>
            <Badan style={{ fontSize: 14 }}>{salam()},</Badan>
            <Judul style={{ marginTop: 1 }}>{profil.fullName.split(' ')[0]}</Judul>
          </View>
          <Tekan onPress={() => router.push('/(tabs)/profil')} getarkan={false}>
            <View
              style={{
                width: 44, height: 44, borderRadius: 999,
                backgroundColor: t.aksenLembut,
                borderWidth: StyleSheet.hairlineWidth, borderColor: t.kartuTepi,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={[teks.sedang, { color: t.aksen }]}>{inisial}</Text>
            </View>
          </Tekan>
        </View>
      </Muncul>

      {/* ── kartu absen ── */}
      <Muncul jeda={60}>
        <KartuUtama>
          <Label terang>{tanggalPanjang(sekarang)}</Label>

          <Text
            style={[
              teks.raksasa,
              angka,
              { color: '#ffffff', marginTop: 6, fontSize: 46, letterSpacing: -2 },
            ]}
          >
            {String(sekarang.getHours()).padStart(2, '0')}
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>.</Text>
            {String(sekarang.getMinutes()).padStart(2, '0')}
          </Text>

          <View style={{ flexDirection: 'row', gap: jarak.xl, marginTop: jarak.md, marginBottom: jarak.lg }}>
            {([
              ['Masuk', hariIni.clockIn, 'log-in-outline'],
              ['Pulang', hariIni.clockOut, 'log-out-outline'],
            ] as const).map(([label, nilai, ikon]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.sm }}>
                <Ionicons name={ikon} size={15} color="rgba(255,255,255,0.55)" />
                <View>
                  <Label terang style={{ fontSize: 10 }}>{label}</Label>
                  <Text style={[teks.sedang, angka, { color: nilai ? '#ffffff' : 'rgba(255,255,255,0.4)', marginTop: 1 }]}>
                    {jam(nilai)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {hariIni.lateMinutes > 0 ? (
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: jarak.sm,
                paddingHorizontal: jarak.md, paddingVertical: jarak.sm,
                borderRadius: lengkung.sm, backgroundColor: 'rgba(255,255,255,0.14)',
                marginBottom: jarak.md,
              }}
            >
              <Ionicons name="alert-circle-outline" size={15} color="#ffffff" />
              <Text style={[teks.label, { color: '#ffffff', flex: 1 }]}>
                Tercatat terlambat {hariIni.lateMinutes} menit hari ini.
              </Text>
            </View>
          ) : null}

          {!hariIni.sudahMasuk ? (
            <Tombol
              judul="Absen masuk"
              jenis="kaca"
              onPress={() => absen('IN')}
              memuat={absenSibuk}
              ikon={<Ionicons name="finger-print-outline" size={19} color="#ffffff" />}
            />
          ) : !hariIni.sudahPulang ? (
            <Tombol
              judul="Absen pulang"
              jenis="kaca"
              onPress={mintaPulang}
              memuat={absenSibuk}
              ikon={<Ionicons name="log-out-outline" size={19} color="#ffffff" />}
            />
          ) : (
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: jarak.sm,
                paddingVertical: jarak.md, borderRadius: lengkung.md,
                backgroundColor: 'rgba(255,255,255,0.14)',
              }}
            >
              <Ionicons name="checkmark-circle" size={17} color="#ffffff" />
              <Text style={[teks.label, { color: '#ffffff' }]}>Absen hari ini lengkap. Terima kasih.</Text>
            </View>
          )}
        </KartuUtama>
      </Muncul>

      {/* ── aksi cepat ── */}
      <Muncul jeda={110}>
        <View style={{ flexDirection: 'row', gap: jarak.sm }}>
          {([
            ['Ajukan cuti', 'sunny-outline', '/(tabs)/pengajuan'],
            ['Ajukan lembur', 'moon-outline', '/(tabs)/pengajuan'],
            ['Slip gaji', 'receipt-outline', '/(tabs)/slip'],
          ] as const).map(([label, ikon, tujuan]) => (
            <Tekan key={label} onPress={() => router.push(tujuan)} style={{ flex: 1 }}>
              <Kartu rapat style={{ alignItems: 'center', gap: 7, paddingVertical: jarak.md }}>
                <View
                  style={{
                    width: 38, height: 38, borderRadius: 999,
                    backgroundColor: t.aksenLembut, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name={ikon} size={18} color={t.aksen} />
                </View>
                <Text style={[teks.mikro, { color: t.badan, textTransform: 'none', textAlign: 'center' }]}>
                  {label}
                </Text>
              </Kartu>
            </Tekan>
          ))}
        </View>
      </Muncul>

      {/* ── ubin ringkasan ── */}
      <Muncul jeda={160} style={{ flexDirection: 'row', gap: jarak.md }}>
        <Kartu style={{ flex: 1 }}>
          <Label>Sisa cuti</Label>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 5 }}>
            <Text style={[teks.judul, angka, { color: t.kuat }]}>{kuotaCuti.sisa}</Text>
            <Badan style={{ fontSize: 13 }}>hari</Badan>
          </View>
          <BilahKecil bagian={kuotaCuti.terpakai} dari={kuotaCuti.kuota} />
        </Kartu>

        <Kartu style={{ flex: 1 }}>
          <Label>Hadir bulan ini</Label>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 5 }}>
            <Text style={[teks.judul, angka, { color: t.kuat }]}>{hadir}</Text>
            <Badan style={{ fontSize: 13 }}>hari</Badan>
          </View>
          <Badan style={{ fontSize: 12, marginTop: 7 }}>
            {kehadiranBulanIni.LATE ? `${kehadiranBulanIni.LATE}× terlambat` : 'Tanpa keterlambatan'}
          </Badan>
        </Kartu>
      </Muncul>

      {/* ── slip terakhir ── */}
      {slipTerakhir ? (
        <Muncul jeda={210}>
          <Tekan onPress={() => router.push(`/slip/${slipTerakhir.id}`)}>
            <Kartu>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Label>Slip terakhir</Label>
                <Lencana status="PAID" teks={slipTerakhir.run.kind === 'THR' ? 'THR' : 'Dibayarkan'} />
              </View>

              <Text style={[teks.judul, angka, { color: t.kuat, marginTop: jarak.sm }]}>
                {rupiah(slipTerakhir.netPay)}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Badan style={{ fontSize: 13, flex: 1 }}>
                  {namaPeriode(slipTerakhir.run.period)} · dibayar {tanggal(slipTerakhir.run.payDate)}
                </Badan>
                <Ionicons name="chevron-forward" size={17} color={t.redup} />
              </View>
            </Kartu>
          </Tekan>
        </Muncul>
      ) : (
        <Kosong
          pesan="Belum ada slip gaji untuk Anda. Slip muncul di sini setelah periode gaji dibayarkan."
          ikon="receipt-outline"
        />
      )}

      {/* ── pengajuan menunggu ── */}
      {tertundaTotal > 0 ? (
        <Muncul jeda={260}>
          <Tekan onPress={() => router.push('/(tabs)/pengajuan')}>
            <Kartu rapat>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
                <View
                  style={{
                    width: 38, height: 38, borderRadius: 999,
                    backgroundColor: t.peringatanLembut, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="hourglass-outline" size={18} color={t.peringatan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[teks.label, { color: t.kuat }]}>
                    {tertundaTotal} pengajuan menunggu ditinjau
                  </Text>
                  <Badan style={{ fontSize: 12, marginTop: 1 }}>
                    {tertunda.cuti} cuti · {tertunda.lembur} lembur
                  </Badan>
                </View>
                <Ionicons name="chevron-forward" size={17} color={t.redup} />
              </View>
            </Kartu>
          </Tekan>
        </Muncul>
      ) : null}
    </ScrollView>
  );
}

/** Bilah tipis untuk perbandingan sederhana — satu angka, bukan grafik. */
function BilahKecil({ bagian, dari }: { bagian: number; dari: number }) {
  const t = useTema();
  const persen = Math.min(100, (bagian / Math.max(1, dari)) * 100);
  return (
    <View
      style={{
        height: 5, borderRadius: 999, backgroundColor: t.isian,
        marginTop: jarak.md, overflow: 'hidden',
      }}
    >
      <View style={{ height: 5, borderRadius: 999, backgroundColor: t.aksen, width: `${persen}%` }} />
    </View>
  );
}
