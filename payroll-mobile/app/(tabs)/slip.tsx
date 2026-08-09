import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type RingkasSlip } from '../../src/api';
import { namaPeriode, rupiah, tanggal } from '../../src/format';
import {
  Badan, Galat, Kartu, KartuUtama, Kosong, Label, Lencana, MemuatDaftar, Muncul, Tekan, useRuangAtas, useRuangBawah, useTema,
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
  if (!daftar) return <MemuatDaftar jumlah={4} baris={2} />;

  const totalTahunIni = daftar
    .filter((s) => s.run.period.startsWith(String(new Date().getFullYear())))
    .reduce((a, s) => a + s.netPay, 0);

  return (
    <ScrollView
      contentContainerStyle={{
        padding: jarak.lg,
        paddingTop: ruangAtas + jarak.md,
        paddingBottom: ruangBawah,
        gap: jarak.md,
      }}
      refreshControl={
        <RefreshControl refreshing={segar} tintColor={t.aksen}
          onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }} />
      }
    >
      {daftar.length === 0 ? (
        <Kosong
          pesan="Belum ada slip gaji yang diterbitkan untuk Anda. Slip muncul di sini setelah periode gaji dibayarkan HRD."
          ikon="receipt-outline"
        />
      ) : (
        <>
          <Muncul>
            <KartuUtama>
              <Label terang>Diterima sepanjang {new Date().getFullYear()}</Label>
              <Text style={[teks.judul, angka, { color: '#ffffff', marginTop: 6, fontSize: 30 }]}>
                {rupiah(totalTahunIni)}
              </Text>
              <Text style={[teks.label, { color: 'rgba(255,255,255,0.62)', marginTop: 3 }]}>
                dari {daftar.length} slip yang sudah dibayarkan
              </Text>
            </KartuUtama>
          </Muncul>

          {daftar.map((s, i) => (
            <Muncul key={s.id} jeda={60 + i * 45}>
              <Tekan onPress={() => router.push(`/slip/${s.id}`)}>
                <Kartu>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.sm }}>
                        <Text style={[teks.sedang, { color: t.kuat }]}>
                          {s.run.kind === 'THR' ? s.run.holidayName ?? 'THR' : namaPeriode(s.run.period)}
                        </Text>
                        {s.run.kind === 'THR' ? <Lencana status="APPROVED" teks="THR" /> : null}
                      </View>
                      <Badan style={{ fontSize: 12, marginTop: 2 }}>
                        Dibayar {tanggal(s.run.payDate)}
                      </Badan>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[teks.sedang, angka, { color: t.kuat }]}>
                        {rupiah(s.netPay)}
                      </Text>
                      <Badan style={{ fontSize: 11 }}>bersih</Badan>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={t.redup} />
                  </View>
                </Kartu>
              </Tekan>
            </Muncul>
          ))}
        </>
      )}
    </ScrollView>
  );
}
