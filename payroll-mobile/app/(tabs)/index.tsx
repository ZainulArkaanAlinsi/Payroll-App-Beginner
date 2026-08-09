import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type Beranda } from '../../src/api';
import { jam, namaPeriode, rupiah, salam, tanggal } from '../../src/format';
import {
  Bagian, Badan, BarisDaftar, Galat, Kartu, Kosong, Label, Lencana, MemuatLayar,
  Muncul, Panel, PilAksi, Saldo, Tekan, useRuangBawah, useTema,
} from '../../src/ui';
import { getar } from '../../src/getar';
import { jarak, lengkung, tabular, teks } from '../../src/theme';

export default function LayarBeranda() {
  const t = useTema();
  const ruangBawah = useRuangBawah();
  const router = useRouter();

  const [data, setData] = useState<Beranda | null>(null);
  const [galat, setGalat] = useState('');
  const [segar, setSegar] = useState(false);
  const [absenSibuk, setAbsenSibuk] = useState(false);

  const muat = useCallback(async () => {
    try {
      setData(await api.saya());
      setGalat('');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.');
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);
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
  function tekanAbsen() {
    if (absenSibuk) return;
    if (!data?.hariIni.sudahMasuk) return absen('IN');
    if (!data.hariIni.sudahPulang) {
      return Alert.alert(
        'Absen pulang sekarang?',
        'Jam pulang akan tercatat dan tidak bisa Anda ubah sendiri.',
        [
          { text: 'Belum', style: 'cancel' },
          { text: 'Absen pulang', onPress: () => absen('OUT') },
        ],
      );
    }
    Alert.alert('Sudah lengkap', 'Absen masuk dan pulang hari ini sudah tercatat.');
  }

  if (galat && !data) return <Galat pesan={galat} coba={muat} />;
  if (!data) return <MemuatLayar />;

  const { profil, hariIni, kuotaCuti, slipTerakhir, tertunda, kehadiranBulanIni } = data;
  const hadir = (kehadiranBulanIni.PRESENT ?? 0) + (kehadiranBulanIni.WFH ?? 0) + (kehadiranBulanIni.LATE ?? 0);
  const tertundaTotal = tertunda.cuti + tertunda.lembur;
  const inisial = profil.fullName.split(' ').slice(0, 2).map((x) => x[0]).join('');

  const labelAbsen = !hariIni.sudahMasuk ? 'Absen masuk' : !hariIni.sudahPulang ? 'Absen pulang' : 'Selesai';
  const ikonAbsen = !hariIni.sudahMasuk ? 'finger-print' : !hariIni.sudahPulang ? 'exit-outline' : 'checkmark-circle';

  return (
    <View style={{ flex: 1, backgroundColor: t.latar }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: ruangBawah }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={segar}
            onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
            tintColor={t.tintaRedup}
          />
        }
      >
        {/* ══════════ panel utama ══════════ */}
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
            <View
              style={{
                width: 40, height: 40, borderRadius: 999,
                backgroundColor: t.panelIsian,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={[teks.sedang, { color: '#ffffff' }]}>{inisial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Label atas>{salam()},</Label>
              <Text style={[teks.sedang, { color: '#ffffff', marginTop: 1 }]} numberOfLines={1}>
                {profil.fullName.split(' ').slice(0, 2).join(' ')}
              </Text>
            </View>
            {tertundaTotal > 0 ? (
              <Tekan onPress={() => router.push('/(tabs)/pengajuan')} getarkan={false}>
                <View
                  style={{
                    width: 38, height: 38, borderRadius: 999,
                    backgroundColor: t.panelIsian,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="notifications-outline" size={18} color="#ffffff" />
                  <View
                    style={{
                      position: 'absolute', top: 8, right: 9,
                      width: 8, height: 8, borderRadius: 999, backgroundColor: t.merek,
                    }}
                  />
                </View>
              </Tekan>
            ) : null}
          </View>

          {/* angka terbesar di seluruh aplikasi */}
          <View style={{ marginTop: jarak.xl }}>
            <Label atas>Gaji terakhir diterima</Label>
            <Saldo
              nilai={rupiah(slipTerakhir?.netPay ?? 0)}
              warna="#ffffff"
              redup="rgba(255,255,255,0.45)"
              style={{ marginTop: 4 }}
            />
            {slipTerakhir ? (
              <Text style={[teks.kecil, { color: t.panelRedup, marginTop: 4 }]}>
                {namaPeriode(slipTerakhir.run.period)} · dibayar {tanggal(slipTerakhir.run.payDate)}
              </Text>
            ) : (
              <Text style={[teks.kecil, { color: t.panelRedup, marginTop: 4 }]}>
                Belum ada slip yang diterbitkan
              </Text>
            )}
          </View>

          {/* deret pil aksi */}
          <View style={{ flexDirection: 'row', marginTop: jarak.xl }}>
            <PilAksi ikon={ikonAbsen as never} label={labelAbsen} onPress={tekanAbsen} sorot />
            <PilAksi ikon="sunny-outline" label="Cuti" onPress={() => router.push('/(tabs)/pengajuan')} />
            <PilAksi ikon="moon-outline" label="Lembur" onPress={() => router.push('/(tabs)/pengajuan')} />
            <PilAksi ikon="receipt-outline" label="Slip" onPress={() => router.push('/(tabs)/slip')} />
          </View>
        </Panel>

        {/* ══════════ lembar isi ══════════ */}
        <View style={{ padding: jarak.lg, gap: jarak.lg }}>
          {/* absen hari ini */}
          <Muncul>
            <Kartu putih>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Bagian judul="Hari ini" />
                {hariIni.status ? <Lencana status={hariIni.status} /> : null}
              </View>

              <View style={{ flexDirection: 'row', gap: jarak.md, marginTop: jarak.xs }}>
                {([
                  ['Masuk', hariIni.clockIn, 'log-in-outline'],
                  ['Pulang', hariIni.clockOut, 'log-out-outline'],
                ] as const).map(([label, nilai, ikon]) => (
                  <View
                    key={label}
                    style={{
                      flex: 1, backgroundColor: t.lembut,
                      borderRadius: lengkung.md, padding: jarak.md,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name={ikon} size={13} color={t.tintaRedup} />
                      <Label>{label}</Label>
                    </View>
                    <Text
                      style={[
                        teks.angka, tabular,
                        { color: nilai ? t.tinta : t.tintaRedup, marginTop: 3 },
                      ]}
                    >
                      {jam(nilai)}
                    </Text>
                  </View>
                ))}
              </View>

              {hariIni.lateMinutes > 0 ? (
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 7,
                    marginTop: jarak.md, padding: jarak.md,
                    borderRadius: lengkung.md, backgroundColor: t.tungguLembut,
                  }}
                >
                  <Ionicons name="alert-circle" size={15} color={t.tunggu} />
                  <Text style={[teks.kecil, { color: t.tunggu, flex: 1 }]}>
                    Tercatat terlambat {hariIni.lateMinutes} menit.
                  </Text>
                </View>
              ) : null}
            </Kartu>
          </Muncul>

          {/* dua ubin ringkas */}
          <Muncul jeda={60}>
            <View style={{ flexDirection: 'row', gap: jarak.md }}>
              <Kartu putih style={{ flex: 1 }}>
                <Label>Sisa cuti</Label>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                  <Text style={[teks.angka, tabular, { color: t.tinta, fontSize: 25 }]}>
                    {kuotaCuti.sisa}
                  </Text>
                  <Badan style={{ fontSize: 12.5 }}>/ {kuotaCuti.kuota} hari</Badan>
                </View>
                <View
                  style={{
                    height: 6, borderRadius: 999, backgroundColor: t.lembut,
                    marginTop: jarak.md, overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: 6, borderRadius: 999, backgroundColor: t.merek,
                      width: `${Math.min(100, (kuotaCuti.terpakai / Math.max(1, kuotaCuti.kuota)) * 100)}%`,
                    }}
                  />
                </View>
              </Kartu>

              <Kartu putih style={{ flex: 1 }}>
                <Label>Hadir bulan ini</Label>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                  <Text style={[teks.angka, tabular, { color: t.tinta, fontSize: 25 }]}>{hadir}</Text>
                  <Badan style={{ fontSize: 12.5 }}>hari</Badan>
                </View>
                <View style={{ marginTop: jarak.md }}>
                  {kehadiranBulanIni.LATE ? (
                    <Lencana status="LATE" teks={`${kehadiranBulanIni.LATE}× terlambat`} />
                  ) : (
                    <Lencana status="PRESENT" teks="Tepat waktu" ikon="checkmark" />
                  )}
                </View>
              </Kartu>
            </View>
          </Muncul>

          {/* slip terakhir */}
          <Muncul jeda={120}>
            <Bagian
              judul="Slip terakhir"
              aksi={{ label: 'Lihat semua', onPress: () => router.push('/(tabs)/slip') }}
            />
            <Kartu putih style={{ paddingVertical: jarak.xs }}>
              {slipTerakhir ? (
                <BarisDaftar
                  ikon="receipt"
                  judul={
                    slipTerakhir.run.kind === 'THR'
                      ? 'Tunjangan hari raya'
                      : namaPeriode(slipTerakhir.run.period)
                  }
                  catatan={`Dibayar ${tanggal(slipTerakhir.run.payDate)}`}
                  nilai={rupiah(slipTerakhir.netPay)}
                  subNilai={<Lencana status="PAID" teks="Diterima" />}
                  onPress={() => router.push(`/slip/${slipTerakhir.id}`)}
                  akhir
                />
              ) : (
                <Kosong
                  pesan="Slip gaji akan muncul di sini setelah periode gaji dibayarkan HRD."
                  ikon="receipt-outline"
                />
              )}
            </Kartu>
          </Muncul>

          {/* pintasan */}
          <Muncul jeda={180}>
            <Bagian judul="Lainnya" />
            <Kartu putih style={{ paddingVertical: jarak.xs }}>
              <BarisDaftar
                ikon="paper-plane"
                warna={tertundaTotal > 0 ? t.tunggu : t.merek}
                judul="Pengajuan cuti & lembur"
                catatan={
                  tertundaTotal > 0
                    ? `${tertundaTotal} menunggu ditinjau`
                    : 'Semua pengajuan sudah ditinjau'
                }
                onPress={() => router.push('/(tabs)/pengajuan')}
              />
              <BarisDaftar
                ikon="calendar"
                judul="Riwayat kehadiran"
                catatan="Rekap per bulan"
                onPress={() => router.push('/(tabs)/kehadiran')}
              />
              <BarisDaftar
                ikon="person"
                judul="Profil & rekening"
                catatan={`${profil.employeeNo} · ${profil.department?.name ?? '—'}`}
                onPress={() => router.push('/(tabs)/profil')}
                akhir
              />
            </Kartu>
          </Muncul>
        </View>
      </ScrollView>
    </View>
  );
}
