import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type Beranda } from '../../src/api';
import { jam, namaPeriode, rupiah, salam, tanggal, tanggalPanjang } from '../../src/format';
import { Badan, Galat, Judul, Kartu, Label, Lencana, MemuatDaftar, Muncul, Tombol, useTema } from '../../src/ui';
import { getar } from '../../src/getar';
import { jarak, lengkung, teks } from '../../src/theme';

export default function LayarBeranda() {
  const t = useTema();
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

  useEffect(() => {
    muat();
  }, [muat]);

  // Jam berjalan pada kartu absen — supaya karyawan tahu waktu yang dipakai
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

  return (
    <ScrollView
      contentContainerStyle={{ padding: jarak.lg, gap: jarak.md, paddingBottom: jarak.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={segar}
          onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
          tintColor={t.aksen}
        />
      }
    >
      <Muncul>
        <Badan>{salam()},</Badan>
        <Judul style={{ marginTop: 2 }}>{profil.fullName.split(' ')[0]}</Judul>
        <Badan style={{ marginTop: 2 }}>
          {profil.position?.title ?? '—'} · {profil.department?.name ?? '—'}
        </Badan>
      </Muncul>

      {/* ── kartu absen ── */}
      <Muncul jeda={60}>
      <Kartu>
        <Label>{tanggalPanjang(sekarang)}</Label>
        <Text style={{ fontSize: 42, fontWeight: '700', color: t.kuat, letterSpacing: -1.5, marginTop: 4, fontVariant: ['tabular-nums'] }}>
          {String(sekarang.getHours()).padStart(2, '0')}
          <Text style={{ color: t.redup }}>.</Text>
          {String(sekarang.getMinutes()).padStart(2, '0')}
        </Text>

        <View style={{ flexDirection: 'row', gap: jarak.lg, marginTop: jarak.md, marginBottom: jarak.lg }}>
          <View>
            <Label>Masuk</Label>
            <Text style={[teks.sedang, { color: hariIni.sudahMasuk ? t.kuat : t.redup, marginTop: 2 }]}>
              {jam(hariIni.clockIn)}
            </Text>
          </View>
          <View>
            <Label>Pulang</Label>
            <Text style={[teks.sedang, { color: hariIni.sudahPulang ? t.kuat : t.redup, marginTop: 2 }]}>
              {jam(hariIni.clockOut)}
            </Text>
          </View>
          {hariIni.status ? (
            <View style={{ marginLeft: 'auto', justifyContent: 'center' }}>
              <Lencana status={hariIni.status} />
            </View>
          ) : null}
        </View>

        {hariIni.lateMinutes > 0 ? (
          <View style={{ padding: jarak.sm, borderRadius: lengkung.sm, backgroundColor: t.peringatanLembut, marginBottom: jarak.md }}>
            <Text style={[teks.label, { color: t.peringatan }]}>
              Tercatat terlambat {hariIni.lateMinutes} menit hari ini.
            </Text>
          </View>
        ) : null}

        {!hariIni.sudahMasuk ? (
          <Tombol
            judul="Absen masuk"
            onPress={() => absen('IN')}
            memuat={absenSibuk}
            ikon={<Ionicons name="log-in-outline" size={18} color={t.aksenTeks} />}
          />
        ) : !hariIni.sudahPulang ? (
          <Tombol
            judul="Absen pulang"
            jenis="garis"
            onPress={mintaPulang}
            memuat={absenSibuk}
            ikon={<Ionicons name="log-out-outline" size={18} color={t.kuat} />}
          />
        ) : (
          <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.aksenLembut, alignItems: 'center' }}>
            <Text style={[teks.label, { color: t.aksen }]}>
              Absen hari ini lengkap. Terima kasih.
            </Text>
          </View>
        )}
      </Kartu>
      </Muncul>

      {/* ── ubin ringkasan ── */}
      <Muncul jeda={120} style={{ flexDirection: 'row', gap: jarak.md }}>
        <Kartu rapat style={{ flex: 1 }}>
          <Label>Sisa cuti</Label>
          <Text style={[teks.judul, { color: t.kuat, marginTop: 4 }]}>{kuotaCuti.sisa}</Text>
          <Badan style={{ fontSize: 12 }}>dari {kuotaCuti.kuota} hari</Badan>
        </Kartu>
        <Kartu rapat style={{ flex: 1 }}>
          <Label>Hadir bulan ini</Label>
          <Text style={[teks.judul, { color: t.kuat, marginTop: 4 }]}>{hadir}</Text>
          <Badan style={{ fontSize: 12 }}>
            {kehadiranBulanIni.LATE ? `${kehadiranBulanIni.LATE} kali terlambat` : 'tanpa keterlambatan'}
          </Badan>
        </Kartu>
      </Muncul>

      {/* ── slip terakhir ── */}
      {slipTerakhir ? (
        <Muncul jeda={180}>
        <Kartu>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Slip terakhir</Label>
            <Lencana status="PAID" teks={slipTerakhir.run.kind === 'THR' ? 'THR' : 'Dibayarkan'} />
          </View>
          <Text style={[teks.judul, { color: t.kuat, marginTop: jarak.sm }]}>
            {rupiah(slipTerakhir.netPay)}
          </Text>
          <Badan style={{ marginTop: 2 }}>
            {namaPeriode(slipTerakhir.run.period)} · dibayar {tanggal(slipTerakhir.run.payDate)}
          </Badan>
          <Tombol
            judul="Lihat rincian"
            jenis="garis"
            style={{ marginTop: jarak.md }}
            onPress={() => router.push(`/slip/${slipTerakhir.id}`)}
          />
        </Kartu>
        </Muncul>
      ) : null}

      {/* ── pengajuan menunggu ── */}
      {tertundaTotal > 0 ? (
        <Kartu rapat>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
            <View style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: t.peringatanLembut, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="hourglass-outline" size={17} color={t.peringatan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[teks.label, { color: t.kuat }]}>
                {tertundaTotal} pengajuan menunggu ditinjau
              </Text>
              <Badan style={{ fontSize: 12 }}>
                {tertunda.cuti} cuti · {tertunda.lembur} lembur
              </Badan>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.redup} />
          </View>
        </Kartu>
      ) : null}
    </ScrollView>
  );
}
