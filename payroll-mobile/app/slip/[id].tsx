import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type SlipDetail } from '../../src/api';
import { namaPeriode, rupiah, tanggal } from '../../src/format';
import {
  Bagian, Badan, Galat, Kartu, Label, Lencana, MemuatLayar, Muncul, Panel,
  Saldo, Tekan, useTema,
} from '../../src/ui';
import { jarak, lengkung, tabular, teks } from '../../src/theme';

export default function RincianSlip() {
  const t = useTema();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<SlipDetail | null>(null);
  const [galat, setGalat] = useState('');

  const muat = useCallback(async () => {
    try {
      setData(await api.slipDetail(String(id)));
      setGalat('');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.');
    }
  }, [id]);

  useEffect(() => { muat(); }, [muat]);

  if (galat) return <Galat pesan={galat} coba={muat} />;
  if (!data) return <MemuatLayar baris={5} />;

  /*
   * Dikelompokkan memakai kolom `group`, bukan tanda bilangannya: seluruh nilai
   * di rincian disimpan positif, jadi memilah berdasarkan tanda menempatkan
   * PPh 21 dan iuran BPJS di daftar pendapatan.
   */
  const pendapatan = data.rincian.filter((r) => r.group === 'EARNING');
  const potongan = data.rincian.filter((r) => r.group === 'DEDUCTION');
  const perusahaan = data.rincian.filter((r) => r.group === 'EMPLOYER' && r.amount > 0);

  const judul = data.run.kind === 'THR' ? data.run.holidayName ?? 'THR' : namaPeriode(data.run.period);

  return (
    <View style={{ flex: 1, backgroundColor: t.latar }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + jarak.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
            <Tekan onPress={() => router.back()} hitSlop={12}>
              <View
                style={{
                  width: 38, height: 38, borderRadius: 999,
                  backgroundColor: t.panelIsian,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={18} color="#ffffff" />
              </View>
            </Tekan>
            <Text style={[teks.sedang, { color: '#ffffff', flex: 1 }]} numberOfLines={1}>
              {judul}
            </Text>
          </View>

          <View style={{ marginTop: jarak.xl }}>
            <Label atas>Diterima</Label>
            <Saldo
              nilai={rupiah(data.netPay)}
              warna="#ffffff"
              redup="rgba(255,255,255,0.45)"
              style={{ marginTop: 4 }}
            />
            <Text style={[teks.kecil, { color: t.panelRedup, marginTop: 5 }]}>
              Dibayarkan {tanggal(data.run.payDate)}
              {data.employee.bankName ? ` ke ${data.employee.bankName}` : ''}
              {data.employee.bankAccount ? ` ···${data.employee.bankAccount.slice(-4)}` : ''}
            </Text>
          </View>
        </Panel>

        <View style={{ padding: jarak.lg, gap: jarak.lg }}>
          {data.run.kind === 'THR' ? (
            <Muncul>
              <Kartu>
                <View style={{ flexDirection: 'row', gap: jarak.md }}>
                  <Ionicons name="gift-outline" size={19} color={t.merek} />
                  <View style={{ flex: 1 }}>
                    <Text style={[teks.sedang, { color: t.tinta }]}>
                      Masa kerja {data.serviceMonths} bulan
                    </Text>
                    <Badan style={{ fontSize: 12.5, marginTop: 3, lineHeight: 19 }}>
                      Dihitung menurut Permenaker 6/2016 — masa kerja 12 bulan atau lebih
                      berhak atas satu bulan upah penuh.
                    </Badan>
                  </View>
                </View>
              </Kartu>
            </Muncul>
          ) : null}

          {pendapatan.length ? (
            <Muncul jeda={50}>
              <Bagian judul="Pendapatan" />
              <Kartu putih>
                {pendapatan.map((r, i) => (
                  <Angka key={`${r.label}-${i}`} kiri={r.label} kanan={rupiah(r.amount)} />
                ))}
                <View style={{ height: 1, backgroundColor: t.garis, marginVertical: jarak.sm }} />
                <Angka kiri="Bruto" kanan={rupiah(data.grossPay)} tebal />
              </Kartu>
            </Muncul>
          ) : null}

          {potongan.length ? (
            <Muncul jeda={100}>
              <Bagian judul="Potongan" />
              <Kartu putih>
                {potongan.map((r, i) => (
                  <Angka
                    key={`${r.label}-${i}`}
                    kiri={r.label}
                    kanan={`− ${rupiah(r.amount)}`}
                    warna={t.turun}
                  />
                ))}
                <View style={{ height: 1, backgroundColor: t.garis, marginVertical: jarak.sm }} />
                <Angka
                  kiri="Total potongan"
                  kanan={`− ${rupiah(data.totalDeduction)}`}
                  warna={t.turun}
                  tebal
                />
              </Kartu>
            </Muncul>
          ) : null}

          {perusahaan.length ? (
            <Muncul jeda={150}>
              <Bagian judul="Ditanggung perusahaan" />
              <Kartu putih>
                {perusahaan.map((r, i) => (
                  <Angka key={`${r.label}-${i}`} kiri={r.label} kanan={rupiah(r.amount)} />
                ))}
                <Badan style={{ fontSize: 12, marginTop: jarak.sm, lineHeight: 18 }}>
                  Iuran ini dibayar perusahaan di luar gaji Anda, jadi tidak mengurangi
                  jumlah yang diterima.
                </Badan>
              </Kartu>
            </Muncul>
          ) : null}

          <Muncul jeda={200}>
            <Bagian judul="Pajak & kehadiran" />
            <Kartu putih>
              <Angka kiri="PPh 21" kanan={rupiah(data.pph21)} />
              <Angka
                kiri="Metode"
                kanan={data.taxMethod === 'TER' ? 'TER bulanan' : 'Progresif tahunan'}
              />
              <Angka kiri="Status PTKP" kanan={data.employee.ptkpStatus} />
              {data.run.kind !== 'THR' ? (
                <>
                  <Angka kiri="Hari hadir" kanan={`${data.presentDays} hari`} />
                  {data.overtimeHours > 0 ? (
                    <Angka kiri="Jam lembur" kanan={`${data.overtimeHours} jam`} />
                  ) : null}
                </>
              ) : null}
            </Kartu>
          </Muncul>

          <View style={{ alignItems: 'center', gap: jarak.sm, marginTop: jarak.sm }}>
            <Lencana status={data.transferStatus} />
            <Text style={[teks.kecil, { color: t.tintaRedup, textAlign: 'center', fontSize: 11.5, lineHeight: 17 }]}>
              {data.employee.fullName} · {data.employee.employeeNo}{'\n'}
              Diterbitkan otomatis, tanpa tanda tangan
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Satu baris angka pada rincian slip. */
function Angka({
  kiri, kanan, tebal, warna,
}: { kiri: string; kanan: string; tebal?: boolean; warna?: string }) {
  const t = useTema();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', gap: jarak.md,
        paddingVertical: 7,
      }}
    >
      <Text style={[teks.badan, { color: tebal ? t.tinta : t.tintaSedang, flex: 1 }]} numberOfLines={1}>
        {kiri}
      </Text>
      <Text
        style={[
          tebal ? teks.sedang : teks.badan,
          tabular,
          { color: warna ?? t.tinta },
        ]}
      >
        {kanan}
      </Text>
    </View>
  );
}
