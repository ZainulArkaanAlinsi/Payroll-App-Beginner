import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type RingkasSlip } from '../../src/api';
import { namaPeriode, rupiah, tanggal } from '../../src/format';
import { Badan, Galat, Kartu, Kosong, Label, Lencana, Memuat, useTema } from '../../src/ui';
import { jarak, teks } from '../../src/theme';

export default function LayarSlip() {
  const t = useTema();
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
  if (!daftar) return <Memuat />;

  const totalTahunIni = daftar
    .filter((s) => s.run.period.startsWith(String(new Date().getFullYear())))
    .reduce((a, s) => a + s.netPay, 0);

  return (
    <ScrollView
      contentContainerStyle={{ padding: jarak.lg, gap: jarak.md, paddingBottom: jarak.xxl }}
      refreshControl={
        <RefreshControl refreshing={segar} tintColor={t.aksen}
          onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }} />
      }
    >
      {daftar.length === 0 ? (
        <Kosong pesan="Belum ada slip gaji yang diterbitkan untuk Anda." />
      ) : (
        <>
          <Kartu>
            <Label>Diterima sepanjang {new Date().getFullYear()}</Label>
            <Text style={[teks.judul, { color: t.kuat, marginTop: 4 }]}>{rupiah(totalTahunIni)}</Text>
            <Badan style={{ fontSize: 12 }}>dari {daftar.length} slip</Badan>
          </Kartu>

          {daftar.map((s) => (
            <Pressable key={s.id} onPress={() => router.push(`/slip/${s.id}`)}>
              {({ pressed }) => (
                <Kartu style={{ opacity: pressed ? 0.75 : 1 }}>
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
                      <Text style={[teks.sedang, { color: t.kuat, fontVariant: ['tabular-nums'] }]}>
                        {rupiah(s.netPay)}
                      </Text>
                      <Badan style={{ fontSize: 11 }}>bersih</Badan>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={t.redup} />
                  </View>
                </Kartu>
              )}
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}
