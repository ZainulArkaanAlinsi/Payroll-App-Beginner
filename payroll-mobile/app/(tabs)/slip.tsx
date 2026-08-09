import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type RingkasSlip } from '../../src/api';
import { namaPeriode, rupiah, tanggal } from '../../src/format';
import {
  Badan, Galat, Garis, Kertas, Kolom, Kosong, MemuatDaftar, Muncul, Sobekan,
  Tekan, Uang, useRuangAtas, useRuangBawah, useTema,
} from '../../src/ui';
import { angka, jarak, teks } from '../../src/theme';

export default function LayarSlip() {
  const t = useTema();
  const ruangAtas = useRuangAtas();
  const ruangBawah = useRuangBawah();
  const router = useRouter();

  const [daftar, setDaftar] = useState<RingkasSlip[] | null>(null);
  const [galat, setGalat] = useState('');
  const [segar, setSegar] = useState(false);

  const muat = useCallback(async () => {
    try {
      setDaftar(await api.slipGaji());
      setGalat('');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.');
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  if (galat && !daftar) return <Galat pesan={galat} coba={muat} />;
  if (!daftar) return <MemuatDaftar jumlah={4} />;

  const tahun = new Date().getFullYear();
  const totalTahunIni = daftar
    .filter((s) => s.run.period.startsWith(String(tahun)))
    .reduce((a, s) => a + s.netPay, 0);

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
        {daftar.length === 0 ? (
          <Kosong
            pesan="Belum ada slip gaji yang diterbitkan untuk Anda. Slip muncul setelah periode gaji dibayarkan HRD."
            ikon="document-text-outline"
          />
        ) : (
          <>
            {/* ── jumlah setahun ── */}
            <Muncul>
              <Kolom atas>Diterima sepanjang {tahun}</Kolom>
              <Uang nilai={rupiah(totalTahunIni)} style={{ marginTop: jarak.sm }} />
              <Badan style={{ fontSize: 13.5, marginTop: 6 }}>
                dari {daftar.length} slip yang sudah dibayarkan
              </Badan>
              <Garis tegas style={{ marginTop: jarak.lg }} />
            </Muncul>

            {/* ── daftar slip, masing-masing sobekan ── */}
            <View style={{ gap: jarak.lg, marginTop: jarak.lg }}>
              {daftar.map((s, i) => (
                <Muncul key={s.id} jeda={60 + i * 55}>
                  <Tekan onPress={() => router.push(`/slip/${s.id}`)}>
                    <Sobekan>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Kolom>
                            {s.run.kind === 'THR' ? 'Tunjangan hari raya' : 'Gaji bulanan'}
                          </Kolom>
                          <Text style={[teks.kepala, { color: t.tinta, marginTop: 4 }]}>
                            {s.run.kind === 'THR'
                              ? s.run.holidayName ?? 'THR'
                              : namaPeriode(s.run.period)}
                          </Text>
                          <Badan style={{ fontSize: 13, marginTop: 3 }}>
                            Dibayar {tanggal(s.run.payDate)}
                          </Badan>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[teks.angkaSedang, angka, { color: t.tinta, fontSize: 23 }]}>
                            {rupiah(s.netPay).replace('Rp ', '')}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <Text style={[teks.kolom, { color: t.tintaPudar }]}>Diterima</Text>
                            <Ionicons name="chevron-forward" size={13} color={t.tintaPudar} />
                          </View>
                        </View>
                      </View>
                    </Sobekan>
                  </Tekan>
                </Muncul>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Kertas>
  );
}
