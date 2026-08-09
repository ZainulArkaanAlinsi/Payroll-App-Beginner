import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, API, ApiError, type Beranda } from '../../src/api';
import { useSesi } from '../../src/auth';
import { tanggal } from '../../src/format';
import { KartuBank } from '../../src/KartuBank';
import {
  Bagian, BarisDaftar, Galat, Kartu, Label, MemuatLayar, Muncul, Panel,
  Tombol, useRuangBawah, useTema,
} from '../../src/ui';
import { HURUF, jarak, teks } from '../../src/theme';

const JENIS_KERJA: Record<string, string> = {
  PERMANENT: 'Karyawan tetap',
  CONTRACT: 'Kontrak',
  PROBATION: 'Masa percobaan',
  INTERN: 'Magang',
};

export default function LayarProfil() {
  const t = useTema();
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
  if (!data) return <MemuatLayar baris={5} />;

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

  return (
    <View style={{ flex: 1, backgroundColor: t.latar }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: ruangBawah }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={segar}
            tintColor={t.tintaRedup}
            onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
          />
        }
      >
        <Panel>
          <View style={{ alignItems: 'center', gap: jarak.sm, paddingTop: jarak.md }}>
            <View
              style={{
                width: 76, height: 76, borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.16)',
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26, fontFamily: HURUF.beratII, color: '#ffffff' }}>{inisial}</Text>
            </View>

            <Text style={[teks.judul, { color: '#ffffff', marginTop: 4 }]}>{p.fullName}</Text>
            <Text style={[teks.kecil, { color: t.panelRedup }]}>
              {p.position?.title ?? '—'} · {p.department?.name ?? '—'}
            </Text>
          </View>
        </Panel>

        <View style={{ padding: jarak.lg, gap: jarak.lg }}>
          <Muncul>
            <Bagian judul="Kepegawaian" />
            <Kartu putih style={{ paddingVertical: jarak.xs }}>
              <BarisDaftar ikon="id-card-outline" judul="Nomor karyawan" nilai={p.employeeNo} />
              <BarisDaftar
                ikon="briefcase-outline"
                judul="Status"
                nilai={JENIS_KERJA[p.employmentType] ?? p.employmentType}
              />
              <BarisDaftar ikon="calendar-outline" judul="Bergabung" nilai={tanggal(p.joinDate)} />
              <BarisDaftar ikon="document-text-outline" judul="Status PTKP" nilai={p.ptkpStatus} akhir />
            </Kartu>
          </Muncul>

          {/* Kartu rekening gaji — data yang sama dengan berkas transfer bank */}
          <Muncul jeda={60}>
            <Bagian judul="Rekening gaji" />
            <KartuBank bank={p.bankName} nomor={p.bankAccount} pemilik={p.bankHolder ?? p.fullName} />
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 7,
                marginTop: jarak.md, paddingHorizontal: jarak.xs,
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={t.tintaRedup} />
              <Text style={[teks.kecil, { color: t.tintaRedup, flex: 1, fontSize: 11.5 }]}>
                Cocokkan empat digit terakhir dengan kartu Anda. Bila keliru, hubungi HRD
                sebelum tanggal gajian.
              </Text>
            </View>
          </Muncul>

          <Muncul jeda={120}>
            <Bagian judul="Kontak" />
            <Kartu putih style={{ paddingVertical: jarak.xs }}>
              <BarisDaftar ikon="mail-outline" judul="Surel" catatan={p.email} />
              <BarisDaftar ikon="call-outline" judul="Telepon" catatan={p.phone || 'Belum diisi'} akhir />
            </Kartu>
          </Muncul>

          <Muncul jeda={180}>
            <Tombol
              judul="Keluar"
              jenis="bahaya"
              onPress={konfirmasiKeluar}
              ikon={<Ionicons name="log-out-outline" size={17} color={t.turun} />}
              style={{ marginTop: jarak.sm }}
            />

            <Text
              style={[
                teks.kecil,
                { color: t.tintaRedup, textAlign: 'center', marginTop: jarak.lg, fontSize: 11, lineHeight: 17 },
              ]}
            >
              Racik · portal karyawan{'\n'}
              {API.replace(/^https?:\/\//, '')}
            </Text>
          </Muncul>
        </View>
      </ScrollView>
    </View>
  );
}
