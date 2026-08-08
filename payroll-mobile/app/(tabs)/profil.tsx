import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { api, API, ApiError, type Beranda } from '../../src/api';
import { useSesi } from '../../src/auth';
import { tanggal } from '../../src/format';
import { Baris, Galat, Garis, Kartu, Label, Memuat, Tombol, useTema } from '../../src/ui';
import { jarak, teks } from '../../src/theme';

const JENIS_KERJA: Record<string, string> = {
  PERMANENT: 'Karyawan tetap', CONTRACT: 'Kontrak', PROBATION: 'Masa percobaan', INTERN: 'Magang',
};

export default function LayarProfil() {
  const t = useTema();
  const router = useRouter();
  const { keluar } = useSesi();
  const [data, setData] = useState<Beranda | null>(null);
  const [galat, setGalat] = useState('');
  const [segar, setSegar] = useState(false);

  const muat = useCallback(async () => {
    try { setData(await api.saya()); setGalat(''); }
    catch (e) { setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.'); }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  if (galat && !data) return <Galat pesan={galat} coba={muat} />;
  if (!data) return <Memuat />;

  const p = data.profil;
  const inisial = p.fullName.split(' ').slice(0, 2).map((x) => x[0]).join('');

  function konfirmasiKeluar() {
    Alert.alert('Keluar', 'Anda akan keluar dari akun ini.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => { await keluar(); router.replace('/login'); },
      },
    ]);
  }

  // Rekening ditampilkan sebagian saja. Layar ini sering dibuka di tempat
  // umum, dan nomor rekening penuh tidak perlu terpampang untuk memastikan
  // bahwa yang tercatat sudah benar.
  const rekening = p.bankAccount
    ? `${p.bankName ?? ''} ···${p.bankAccount.slice(-4)}`
    : 'Belum diisi';

  return (
    <ScrollView
      contentContainerStyle={{ padding: jarak.lg, gap: jarak.md, paddingBottom: jarak.xxl }}
      refreshControl={
        <RefreshControl refreshing={segar} tintColor={t.aksen}
          onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }} />
      }
    >
      <Kartu>
        <View style={{ alignItems: 'center', gap: jarak.sm }}>
          <View style={{
            width: 68, height: 68, borderRadius: 999, backgroundColor: t.aksenLembut,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: t.aksen }}>{inisial}</Text>
          </View>
          <Text style={[teks.kepala, { color: t.kuat, textAlign: 'center' }]}>{p.fullName}</Text>
          <Text style={[teks.badan, { color: t.redup, textAlign: 'center' }]}>
            {p.position?.title ?? '—'} · {p.department?.name ?? '—'}
          </Text>
        </View>
      </Kartu>

      <Kartu>
        <Label>Kepegawaian</Label>
        <View style={{ marginTop: jarak.sm }}>
          <Baris kiri="Nomor karyawan" kanan={p.employeeNo} />
          <Garis />
          <Baris kiri="Status" kanan={JENIS_KERJA[p.employmentType] ?? p.employmentType} />
          <Garis />
          <Baris kiri="Bergabung" kanan={tanggal(p.joinDate)} />
          <Garis />
          <Baris kiri="Status PTKP" kanan={p.ptkpStatus} />
        </View>
      </Kartu>

      <Kartu>
        <Label>Kontak & rekening</Label>
        <View style={{ marginTop: jarak.sm }}>
          <Baris kiri="Surel" kanan={p.email} />
          <Garis />
          <Baris kiri="Telepon" kanan={p.phone || 'Belum diisi'} />
          <Garis />
          <Baris kiri="Rekening gaji" kanan={rekening} />
        </View>
        <Text style={[teks.mikro, { color: t.redup, marginTop: jarak.md }]}>
          Ada yang keliru? Hubungi HRD — data ini dipakai untuk transfer gaji.
        </Text>
      </Kartu>

      <Tombol judul="Keluar" jenis="bahaya" onPress={konfirmasiKeluar} />

      <Text style={[teks.mikro, { color: t.redup, textAlign: 'center', marginTop: jarak.sm }]}>
        Racik · portal karyawan{'\n'}{API}
      </Text>
    </ScrollView>
  );
}
