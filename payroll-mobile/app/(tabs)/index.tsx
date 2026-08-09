import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type Beranda } from '../../src/api';
import { jam, namaPeriode, rupiah, salam, tanggal, tanggalPanjang } from '../../src/format';
import {
  Badan, Galat, Garis, Judul, Kepala, Kertas, Kolom, Kosong, MemuatDaftar, Muncul,
  Status, Tekan, Tombol, Uang, useRuangAtas, useRuangBawah, useTema,
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
   * Masuk kepagian tidak merugikan, tetapi jam pulang yang terlanjur tercatat
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
  if (!data) return <MemuatDaftar jumlah={3} />;

  const { profil, hariIni, kuotaCuti, slipTerakhir, tertunda, kehadiranBulanIni } = data;
  const hadir = (kehadiranBulanIni.PRESENT ?? 0) + (kehadiranBulanIni.WFH ?? 0) + (kehadiranBulanIni.LATE ?? 0);
  const tertundaTotal = tertunda.cuti + tertunda.lembur;

  const jj = String(sekarang.getHours()).padStart(2, '0');
  const mm = String(sekarang.getMinutes()).padStart(2, '0');

  return (
    <Kertas>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: jarak.lg,
          paddingTop: ruangAtas + jarak.sm,
          paddingBottom: ruangBawah,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={segar}
            onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
            tintColor={t.tintaPudar}
          />
        }
      >
        {/* ── kepala: sapaan dan jam berjalan ── */}
        <Muncul>
          <Kolom>{tanggalPanjang(sekarang)}</Kolom>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: jarak.md, marginTop: jarak.sm }}>
            <Text
              style={[
                teks.angkaBesar, angka,
                { color: t.tinta, fontSize: 64, letterSpacing: -3.5, lineHeight: 66 },
              ]}
            >
              {jj}
              <Text style={{ color: t.tintaPudar }}>.</Text>
              {mm}
            </Text>

            <View style={{ paddingBottom: 10, flex: 1 }}>
              <Badan style={{ fontSize: 13.5 }}>{salam()},</Badan>
              <Kepala>{profil.fullName.split(' ')[0]}</Kepala>
            </View>
          </View>
        </Muncul>

        {/* ── absen hari ini ── */}
        <Muncul jeda={60}>
          <Garis tegas style={{ marginTop: jarak.lg }} />

          <View style={{ flexDirection: 'row', paddingVertical: jarak.lg, gap: jarak.xl }}>
            {([
              ['Masuk', hariIni.clockIn],
              ['Pulang', hariIni.clockOut],
            ] as const).map(([label, nilai]) => (
              <View key={label} style={{ flex: 1 }}>
                <Kolom>{label}</Kolom>
                <Text
                  style={[
                    teks.angkaSedang, angka,
                    { color: nilai ? t.tinta : t.tintaPudar, marginTop: 3, fontSize: 26 },
                  ]}
                >
                  {jam(nilai)}
                </Text>
              </View>
            ))}

            {hariIni.status ? (
              <View style={{ justifyContent: 'flex-end', paddingBottom: 5 }}>
                <Status status={hariIni.status} />
              </View>
            ) : null}
          </View>

          {hariIni.lateMinutes > 0 ? (
            <View style={{ flexDirection: 'row', gap: jarak.sm, marginBottom: jarak.lg }}>
              <View style={{ width: 2, backgroundColor: t.tunggu, borderRadius: 1 }} />
              <Badan style={{ flex: 1, fontSize: 13.5 }}>
                Tercatat terlambat {hariIni.lateMinutes} menit hari ini.
              </Badan>
            </View>
          ) : null}

          {!hariIni.sudahMasuk ? (
            <Tombol
              judul="Absen masuk"
              onPress={() => absen('IN')}
              memuat={absenSibuk}
              ikon={<Ionicons name="arrow-forward" size={17} color={t.kertas} />}
            />
          ) : !hariIni.sudahPulang ? (
            <Tombol
              judul="Absen pulang"
              jenis="garis"
              onPress={mintaPulang}
              memuat={absenSibuk}
              ikon={<Ionicons name="arrow-back" size={17} color={t.tinta} />}
            />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.sm, paddingVertical: jarak.sm }}>
              <Ionicons name="checkmark" size={16} color={t.positif} />
              <Badan style={{ fontSize: 13.5 }}>Absen hari ini lengkap. Terima kasih.</Badan>
            </View>
          )}

          <Garis tegas style={{ marginTop: jarak.lg }} />
        </Muncul>

        {/* ── dua angka ringkas, dipisah garis bukan kotak ── */}
        <Muncul jeda={120}>
          <View style={{ flexDirection: 'row', paddingVertical: jarak.lg }}>
            <View style={{ flex: 1 }}>
              <Kolom>Sisa cuti</Kolom>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                <Text style={[teks.angkaSedang, angka, { color: t.tinta }]}>{kuotaCuti.sisa}</Text>
                <Badan style={{ fontSize: 13 }}>/ {kuotaCuti.kuota} hari</Badan>
              </View>
            </View>

            <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: t.garis, marginHorizontal: jarak.lg }} />

            <View style={{ flex: 1 }}>
              <Kolom>Hadir bulan ini</Kolom>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                <Text style={[teks.angkaSedang, angka, { color: t.tinta }]}>{hadir}</Text>
                <Badan style={{ fontSize: 13 }}>
                  {kehadiranBulanIni.LATE ? `· ${kehadiranBulanIni.LATE} telat` : 'hari'}
                </Badan>
              </View>
            </View>
          </View>

          <Garis />
        </Muncul>

        {/* ── slip terakhir: angka terbesar di layar ini ── */}
        {slipTerakhir ? (
          <Muncul jeda={180}>
            <Tekan onPress={() => router.push(`/slip/${slipTerakhir.id}`)}>
              <View style={{ paddingTop: jarak.xl, paddingBottom: jarak.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Kolom atas>Diterima terakhir</Kolom>
                  <Ionicons name="arrow-forward" size={15} color={t.tintaPudar} />
                </View>

                <Uang nilai={rupiah(slipTerakhir.netPay)} style={{ marginTop: jarak.sm }} />

                <Badan style={{ fontSize: 13.5, marginTop: 6 }}>
                  {namaPeriode(slipTerakhir.run.period)} · dibayar {tanggal(slipTerakhir.run.payDate)}
                </Badan>
              </View>
            </Tekan>
            <Garis />
          </Muncul>
        ) : (
          <Kosong
            pesan="Belum ada slip gaji untuk Anda. Slip muncul di sini setelah periode gaji dibayarkan."
            ikon="document-text-outline"
          />
        )}

        {/* ── pintasan, sebagai baris teks bukan ubin ── */}
        <Muncul jeda={240}>
          {([
            ['Ajukan cuti atau lembur', 'paper-plane-outline', '/(tabs)/pengajuan'],
            ['Riwayat kehadiran', 'calendar-outline', '/(tabs)/kehadiran'],
            ['Semua slip gaji', 'documents-outline', '/(tabs)/slip'],
          ] as const).map(([label, ikon, tujuan], i) => (
            <View key={label}>
              {i > 0 ? <Garis /> : null}
              <Tekan onPress={() => router.push(tujuan)}>
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: jarak.md,
                    paddingVertical: jarak.lg,
                  }}
                >
                  <Ionicons name={ikon} size={17} color={t.tintaPudar} />
                  <Text style={[teks.badan, { color: t.tinta, flex: 1 }]}>{label}</Text>
                  {label.startsWith('Ajukan') && tertundaTotal > 0 ? (
                    <Text style={[teks.kolom, { color: t.tunggu }]}>{tertundaTotal} MENUNGGU</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={15} color={t.tintaPudar} />
                </View>
              </Tekan>
            </View>
          ))}
          <Garis />
        </Muncul>

        <Text
          style={[
            teks.kolom,
            { color: t.tintaPudar, textAlign: 'center', marginTop: jarak.xl, opacity: 0.7 },
          ]}
        >
          {profil.employeeNo} · {profil.department?.name ?? '—'}
        </Text>
      </ScrollView>
    </Kertas>
  );
}
