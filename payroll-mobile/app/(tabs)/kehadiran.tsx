import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type RiwayatKehadiran } from '../../src/api';
import { bulanIni, durasi, geserBulan, hariKalender, jam, namaPeriode } from '../../src/format';
import { Badan, Galat, Kartu, Kosong, Lencana, Muncul, RangkaKartu, useTema } from '../../src/ui';
import { jarak, lengkung, teks } from '../../src/theme';

export default function LayarKehadiran() {
  const t = useTema();
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

  return (
    <ScrollView
      contentContainerStyle={{ padding: jarak.lg, gap: jarak.md, paddingBottom: jarak.xxl }}
      refreshControl={
        <RefreshControl refreshing={segar} tintColor={t.aksen}
          onRefresh={async () => { setSegar(true); await muat(bulan); setSegar(false); }} />
      }
    >
      {/* pemilih bulan */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => setBulan((b) => geserBulan(b, -1))} hitSlop={12} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={22} color={t.badan} />
        </Pressable>
        <Text style={[teks.kepala, { color: t.kuat }]}>{namaPeriode(bulan)}</Text>
        <Pressable
          onPress={() => bolehMaju && setBulan((b) => geserBulan(b, 1))}
          hitSlop={12}
          disabled={!bolehMaju}
          style={{ padding: 6, opacity: bolehMaju ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-forward" size={22} color={t.badan} />
        </Pressable>
      </View>

      {galat ? <Galat pesan={galat} coba={() => muat(bulan)} /> : !data ? (
        <>
          <RangkaKartu baris={2} />
          <RangkaKartu baris={5} />
        </>
      ) : (
        <Muncul style={{ gap: jarak.md }}>
          {/* ringkasan */}
          <View style={{ flexDirection: 'row', gap: jarak.sm, flexWrap: 'wrap' }}>
            {(['PRESENT', 'WFH', 'LATE', 'LEAVE', 'ABSENT'] as const)
              .filter((k) => data.ringkas[k])
              .map((k) => (
                <Kartu key={k} rapat style={{ flexGrow: 1, minWidth: 92 }}>
                  <Text style={[teks.kepala, { color: t.kuat }]}>{data.ringkas[k]}</Text>
                  <View style={{ marginTop: 4 }}><Lencana status={k} /></View>
                </Kartu>
              ))}
          </View>

          {data.totalMenitTelat > 0 ? (
            <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.peringatanLembut }}>
              <Text style={[teks.label, { color: t.peringatan }]}>
                Total keterlambatan bulan ini {durasi(data.totalMenitTelat)}.
              </Text>
            </View>
          ) : null}

          {/* daftar hari */}
          {data.hari.length === 0 ? (
            <Kosong pesan="Belum ada catatan kehadiran pada bulan ini." ikon="calendar-outline" />
          ) : (
            <Kartu style={{ padding: 0, overflow: 'hidden' }}>
              {data.hari.map((h, i) => {
                const hk = hariKalender(h.date);
                return (
                  <View
                    key={h.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: jarak.md,
                      paddingHorizontal: jarak.lg, paddingVertical: jarak.md,
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: t.kartuTepi,
                    }}
                  >
                    <View style={{ width: 38, alignItems: 'center' }}>
                      <Text style={[teks.sedang, { color: t.kuat }]}>{hk.angka}</Text>
                      <Text style={[teks.mikro, { color: t.redup }]}>{hk.nama}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Lencana status={h.status} />
                      <Badan style={{ fontSize: 12, marginTop: 4 }}>
                        {jam(h.clockIn)} – {jam(h.clockOut)}
                        {h.workMinutes ? ` · ${durasi(h.workMinutes)}` : ''}
                      </Badan>
                    </View>
                    {h.lateMinutes > 0 ? (
                      <Text style={[teks.mikro, { color: t.peringatan }]}>+{h.lateMinutes} mnt</Text>
                    ) : null}
                  </View>
                );
              })}
            </Kartu>
          )}
        </Muncul>
      )}
    </ScrollView>
  );
}
