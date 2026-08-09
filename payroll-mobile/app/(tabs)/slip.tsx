import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type RingkasSlip } from '../../src/api';
import { namaPeriode, rupiah, tanggal } from '../../src/format';
import {
  Badan, Galat, Kosong, Label, Lencana, MemuatLayar, Muncul, Panel, Saldo,
  Struk, Tekan, useRuangBawah, useTema,
} from '../../src/ui';
import { jarak, tabular, teks } from '../../src/theme';

export default function LayarSlip() {
  const t = useTema();
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
  if (!daftar) return <MemuatLayar baris={4} />;

  const tahun = new Date().getFullYear();
  const totalTahunIni = daftar
    .filter((s) => s.run.period.startsWith(String(tahun)))
    .reduce((a, s) => a + s.netPay, 0);

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
        <Panel>
          <Text style={[teks.sedang, { color: '#ffffff' }]}>Slip gaji</Text>

          <View style={{ marginTop: jarak.xl }}>
            <Label atas>Diterima sepanjang {tahun}</Label>
            <Saldo
              nilai={rupiah(totalTahunIni)}
              warna="#ffffff"
              redup="rgba(255,255,255,0.45)"
              style={{ marginTop: 4 }}
            />
            <Text style={[teks.kecil, { color: t.panelRedup, marginTop: 4 }]}>
              dari {daftar.length} slip yang sudah dibayarkan
            </Text>
          </View>
        </Panel>

        <View style={{ padding: jarak.lg, gap: jarak.lg }}>
          {daftar.length === 0 ? (
            <Kosong
              pesan="Belum ada slip gaji yang diterbitkan untuk Anda. Slip muncul setelah periode gaji dibayarkan HRD."
              ikon="receipt-outline"
            />
          ) : (
            daftar.map((s, i) => (
              <Muncul key={s.id} jeda={i * 55}>
                <Tekan onPress={() => router.push(`/slip/${s.id}`)}>
                  <Struk
                    atas={
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Label>
                            {s.run.kind === 'THR' ? 'Tunjangan hari raya' : 'Gaji bulanan'}
                          </Label>
                          <Text style={[teks.kepala, { color: t.tinta, marginTop: 3 }]}>
                            {s.run.kind === 'THR'
                              ? s.run.holidayName ?? 'THR'
                              : namaPeriode(s.run.period)}
                          </Text>
                        </View>
                        <Lencana status="PAID" teks="Diterima" ikon="checkmark" />
                      </View>
                    }
                    bawah={
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <View style={{ flex: 1 }}>
                          <Label>Dibayar {tanggal(s.run.payDate)}</Label>
                          <Text style={[teks.saldoKecil, tabular, { color: t.tinta, marginTop: 2 }]}>
                            <Text style={{ fontSize: 14, fontWeight: '700' }}>Rp </Text>
                            {rupiah(s.netPay).replace('Rp ', '')}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 3 }}>
                          <Text style={[teks.kecil, { color: t.merek, fontWeight: '700' }]}>Rincian</Text>
                          <Ionicons name="chevron-forward" size={14} color={t.merek} />
                        </View>
                      </View>
                    }
                  />
                </Tekan>
              </Muncul>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
