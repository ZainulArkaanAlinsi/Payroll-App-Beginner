import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type RiwayatKehadiran } from '../../src/api';
import { bulanIni, durasi, geserBulan, hariKalender, jam, namaPeriode } from '../../src/format';
import {
  Badan, Galat, Kartu, Kosong, Label, Lencana, MemuatLayar, Muncul, Panel,
  Rangka, Tekan, useRuangBawah, useTema,
} from '../../src/ui';
import { jarak, lengkung, tabular, teks } from '../../src/theme';

export default function LayarKehadiran() {
  const t = useTema();
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

  const hadir = data
    ? (data.ringkas.PRESENT ?? 0) + (data.ringkas.WFH ?? 0) + (data.ringkas.LATE ?? 0)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.latar }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: ruangBawah }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={segar}
            tintColor={t.tintaRedup}
            onRefresh={async () => { setSegar(true); await muat(bulan); setSegar(false); }}
          />
        }
      >
        <Panel>
          <Text style={[teks.sedang, { color: '#ffffff' }]}>Kehadiran</Text>

          {/* pemilih bulan */}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              marginTop: jarak.lg,
              backgroundColor: t.panelIsian,
              borderRadius: lengkung.pil,
              padding: 5,
            }}
          >
            <Tekan onPress={() => setBulan((b) => geserBulan(b, -1))} hitSlop={10}>
              <View
                style={{
                  width: 34, height: 34, borderRadius: 999,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <Ionicons name="chevron-back" size={17} color="#ffffff" />
              </View>
            </Tekan>

            <Text style={[teks.sedang, { color: '#ffffff' }]}>{namaPeriode(bulan)}</Text>

            <Tekan
              onPress={() => bolehMaju && setBulan((b) => geserBulan(b, 1))}
              hitSlop={10}
              disabled={!bolehMaju}
            >
              <View
                style={{
                  width: 34, height: 34, borderRadius: 999,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  opacity: bolehMaju ? 1 : 0.3,
                }}
              >
                <Ionicons name="chevron-forward" size={17} color="#ffffff" />
              </View>
            </Tekan>
          </View>

          {data ? (
            <View style={{ flexDirection: 'row', marginTop: jarak.lg, gap: jarak.xl }}>
              <View>
                <Label atas>Hadir</Label>
                <Text style={[teks.saldoKecil, tabular, { color: '#ffffff', marginTop: 2 }]}>
                  {hadir}
                  <Text style={{ fontSize: 14, color: t.panelRedup, fontWeight: '600' }}> hari</Text>
                </Text>
              </View>
              <View>
                <Label atas>Keterlambatan</Label>
                <Text style={[teks.saldoKecil, tabular, { color: '#ffffff', marginTop: 2 }]}>
                  {data.totalMenitTelat}
                  <Text style={{ fontSize: 14, color: t.panelRedup, fontWeight: '600' }}> menit</Text>
                </Text>
              </View>
            </View>
          ) : null}
        </Panel>

        <View style={{ padding: jarak.lg, gap: jarak.md }}>
          {!data ? (
            Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
                <Rangka tinggi={44} lebar={44} bulat={lengkung.sm} />
                <View style={{ flex: 1, gap: 7 }}>
                  <Rangka tinggi={13} lebar="44%" />
                  <Rangka tinggi={11} lebar="66%" />
                </View>
              </View>
            ))
          ) : data.hari.length === 0 ? (
            <Kosong
              pesan="Belum ada catatan kehadiran pada bulan ini. Absen masuk dari layar Beranda untuk mulai mencatat."
              ikon="calendar-outline"
            />
          ) : (
            <Muncul>
              <Kartu putih style={{ paddingVertical: jarak.xs }}>
                {data.hari.map((h, i) => {
                  const hk = hariKalender(h.date);
                  const akhir = i === data.hari.length - 1;
                  return (
                    <View
                      key={h.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: jarak.md,
                        paddingVertical: jarak.md,
                        borderBottomWidth: akhir ? 0 : 1,
                        borderColor: t.garis,
                      }}
                    >
                      <View
                        style={{
                          width: 44, height: 44, borderRadius: lengkung.sm,
                          backgroundColor: t.lembut,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={[teks.sedang, tabular, { color: t.tinta, fontSize: 16 }]}>
                          {hk.angka}
                        </Text>
                        <Text style={[teks.kecil, { color: t.tintaRedup, fontSize: 9.5, marginTop: -1 }]}>
                          {hk.nama}
                        </Text>
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Lencana status={h.status} />
                        <Text style={[teks.kecil, tabular, { color: t.tintaSedang }]}>
                          {jam(h.clockIn)} – {jam(h.clockOut)}
                          {h.workMinutes ? `  ·  ${durasi(h.workMinutes)}` : ''}
                        </Text>
                      </View>

                      {h.lateMinutes > 0 ? (
                        <Lencana status="LATE" teks={`+${h.lateMinutes}m`} />
                      ) : null}
                    </View>
                  );
                })}
              </Kartu>
            </Muncul>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
