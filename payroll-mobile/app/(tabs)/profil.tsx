import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { api, API, ApiError, type Beranda } from '../../src/api';
import { useSesi } from '../../src/auth';
import { tanggal } from '../../src/format';
import {
  BarisBuku, Galat, Garis, Kertas, Kolom, MemuatDaftar, Muncul, Tombol,
  useRuangAtas, useRuangBawah, useTema,
} from '../../src/ui';
import { jarak, teks } from '../../src/theme';

const JENIS_KERJA: Record<string, string> = {
  PERMANENT: 'Karyawan tetap',
  CONTRACT: 'Kontrak',
  PROBATION: 'Masa percobaan',
  INTERN: 'Magang',
};

export default function LayarProfil() {
  const t = useTema();
  const ruangAtas = useRuangAtas();
  const ruangBawah = useRuangBawah();
  const router = useRouter();
  const { keluar } = useSesi();

  const [data, setData] = useState<Beranda | null>(null);
  const [galat, setGalat] = useState('');
  const [segar, setSegar] = useState(false);

  const muat = useCallback(async () => {
    try {
      setData(await api.saya());
      setGalat('');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.');
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  if (galat && !data) return <Galat pesan={galat} coba={muat} />;
  if (!data) return <MemuatDaftar jumlah={4} />;

  const p = data.profil;

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
  // umum, dan nomor penuh tidak perlu terpampang hanya untuk memastikan yang
  // tercatat sudah benar.
  const rekening = p.bankAccount
    ? `${p.bankName ?? ''} ···${p.bankAccount.slice(-4)}`
    : 'Belum diisi';

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
            tintColor={t.tintaPudar}
            onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
          />
        }
      >
        <Muncul>
          <Kolom atas>Kartu karyawan</Kolom>
          <Text style={[teks.judul, { color: t.tinta, marginTop: jarak.sm }]}>{p.fullName}</Text>
          <Text style={[teks.badan, { color: t.tintaSedang, marginTop: 3 }]}>
            {p.position?.title ?? '—'} · {p.department?.name ?? '—'}
          </Text>
          <Garis tegas style={{ marginTop: jarak.lg }} />
        </Muncul>

        <Muncul jeda={60}>
          <View style={{ paddingTop: jarak.lg }}>
            <Kolom>Kepegawaian</Kolom>
            <View style={{ marginTop: jarak.xs }}>
              <BarisBuku kiri="Nomor karyawan" kanan={p.employeeNo} />
              <BarisBuku kiri="Status" kanan={JENIS_KERJA[p.employmentType] ?? p.employmentType} />
              <BarisBuku kiri="Bergabung" kanan={tanggal(p.joinDate)} />
              <BarisBuku kiri="Status PTKP" kanan={p.ptkpStatus} />
            </View>
          </View>
          <Garis tegas style={{ marginTop: jarak.md }} />
        </Muncul>

        <Muncul jeda={120}>
          <View style={{ paddingTop: jarak.lg }}>
            <Kolom>Kontak & rekening</Kolom>
            <View style={{ marginTop: jarak.xs }}>
              <BarisBuku kiri="Surel" kanan={p.email} />
              <BarisBuku kiri="Telepon" kanan={p.phone || 'Belum diisi'} />
              <BarisBuku
                kiri="Rekening gaji"
                kanan={rekening}
                catatan="Dipakai untuk transfer gaji — hubungi HRD bila keliru."
              />
            </View>
          </View>
          <Garis tegas style={{ marginTop: jarak.md }} />
        </Muncul>

        <Muncul jeda={180}>
          <Tombol
            judul="Keluar"
            jenis="bahaya"
            onPress={konfirmasiKeluar}
            style={{ marginTop: jarak.xl }}
          />

          <Text
            style={[
              teks.kolom,
              { color: t.tintaPudar, textAlign: 'center', marginTop: jarak.xl, opacity: 0.7 },
            ]}
          >
            RACIK · PORTAL KARYAWAN{'\n'}
            {API.replace(/^https?:\/\//, '')}
          </Text>
        </Muncul>
      </ScrollView>
    </Kertas>
  );
}
