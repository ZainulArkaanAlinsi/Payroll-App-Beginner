import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type RiwayatKehadiran } from '../../src/api';
import { bulanIni, durasi, geserBulan, hariKalender, jam, namaPeriode } from '../../src/format';
import {
  Badan, Galat, Garis, Kertas, Kolom, Kosong, MemuatDaftar, Muncul, Rangka,
  Status, Tekan, useRuangAtas, useRuangBawah, useTema,
} from '../../src/ui';
import { angka, jarak, teks } from '../../src/theme';

export default function LayarKehadiran() {
  const t = useTema();
  const ruangAtas = useRuangAtas();
  const ruangBawah = useRuangBawah();

  const [bulan, setBulan] = useState(bulanIni());
  const [data, setData] = useState<RiwayatKehadiran | null>(null);
  const [galat, setGalat] = useState('');
  const [segar, setSegar] = useState(false);

  const muat = useCallback(async (m: string) => {
    try {
      setData(await api.kehadiran(m));
      setGalat('');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.');
    }
  }, []);

  useEffect(() => { setData(null); muat(bulan); }, [bulan, muat]);

  // Bulan depan tidak bisa dibuka — datanya belum ada, dan tombol yang
  // menghasilkan layar kosong hanya membingungkan.
  const bolehMaju = bulan < bulanIni();

  if (galat && !data) return <Galat pesan={galat} coba={() => muat(bulan)} />;

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
            onRefresh={async () => { setSegar(true); await muat(bulan); setSegar(false); }}
          />
        }
      >
        {/* ── pemilih bulan ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tekan onPress={() => setBulan((b) => geserBulan(b, -1))} hitSlop={14} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={20} color={t.tintaSedang} />
          </Tekan>

          <Text style={[teks.kepala, { color: t.tinta }]}>{namaPeriode(bulan)}</Text>

          <Tekan
            onPress={() => bolehMaju && setBulan((b) => geserBulan(b, 1))}
            hitSlop={14}
            disabled={!bolehMaju}
            style={{ padding: 6, opacity: bolehMaju ? 1 : 0.25 }}
          >
            <Ionicons name="chevron-forward" size={20} color={t.tintaSedang} />
          </Tekan>
        </View>

        <Garis tegas style={{ marginTop: jarak.lg }} />

        {!data ? (
          <View style={{ gap: jarak.lg, paddingTop: jarak.lg }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: jarak.lg }}>
                <Rangka tinggi={26} lebar={30} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Rangka tinggi={12} lebar="38%" />
                  <Rangka tinggi={12} lebar="62%" />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Muncul>
            {/* ── rekap sebagai deret angka, bukan ubin ── */}
            <View style={{ flexDirection: 'row', paddingVertical: jarak.lg }}>
              {(['PRESENT', 'WFH', 'LATE', 'LEAVE', 'ABSENT'] as const)
                .filter((k) => data.ringkas[k])
                .map((k, i, semua) => (
                  <View key={k} style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[teks.angkaSedang, angka, { color: t.tinta, fontSize: 24 }]}>
                        {data.ringkas[k]}
                      </Text>
                      <View style={{ marginTop: 4 }}>
                        <Status status={k} />
                      </View>
                    </View>
                    {i < semua.length - 1 ? (
                      <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: t.garis }} />
                    ) : null}
                  </View>
                ))}
            </View>

            {data.totalMenitTelat > 0 ? (
              <View style={{ flexDirection: 'row', gap: jarak.sm, paddingBottom: jarak.lg }}>
                <View style={{ width: 2, backgroundColor: t.tunggu, borderRadius: 1 }} />
                <Badan style={{ flex: 1, fontSize: 13.5 }}>
                  Total keterlambatan bulan ini {durasi(data.totalMenitTelat)}.
                </Badan>
              </View>
            ) : null}

            <Garis tegas />

            {/* ── daftar hari, seperti baris buku besar ── */}
            {data.hari.length === 0 ? (
              <Kosong
                pesan="Belum ada catatan kehadiran pada bulan ini. Absen masuk dari layar Beranda untuk mulai mencatat."
                ikon="calendar-clear-outline"
              />
            ) : (
              data.hari.map((h, i) => {
                const hk = hariKalender(h.date);
                return (
                  <View key={h.id}>
                    {i > 0 ? <Garis /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.lg, paddingVertical: jarak.md }}>
                      <View style={{ width: 32 }}>
                        <Text style={[teks.sedang, angka, { color: t.tinta, fontSize: 17 }]}>
                          {hk.angka}
                        </Text>
                        <Text style={[teks.kolom, { color: t.tintaPudar, marginTop: 1 }]}>
                          {hk.nama}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Status status={h.status} />
                        <Text style={[teks.kecil, angka, { color: t.tintaSedang, marginTop: 4 }]}>
                          {jam(h.clockIn)} – {jam(h.clockOut)}
                          {h.workMinutes ? `  ·  ${durasi(h.workMinutes)}` : ''}
                        </Text>
                      </View>

                      {h.lateMinutes > 0 ? (
                        <Text style={[teks.kolom, angka, { color: t.tunggu }]}>
                          +{h.lateMinutes}′
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
            {data.hari.length > 0 ? <Garis /> : null}
          </Muncul>
        )}
      </ScrollView>
    </Kertas>
  );
}
