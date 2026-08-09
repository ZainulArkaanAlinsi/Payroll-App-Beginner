import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { api, ApiError, type SlipDetail } from '../../src/api';
import { namaPeriode, rupiah, tanggal } from '../../src/format';
import {
  Badan, BarisBuku, Galat, Garis, Kertas, Kolom, MemuatDaftar, Muncul, Sobekan,
  Uang, useRuangAtas, useTema,
} from '../../src/ui';
import { jarak, teks } from '../../src/theme';

export default function RincianSlip() {
  const t = useTema();
  const ruangAtas = useRuangAtas();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

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

  useEffect(() => {
    if (data) {
      navigation.setOptions({
        title: data.run.kind === 'THR' ? data.run.holidayName ?? 'THR' : namaPeriode(data.run.period),
      });
    }
  }, [data, navigation]);

  if (galat) return <Galat pesan={galat} coba={muat} />;
  if (!data) return <MemuatDaftar jumlah={5} />;

  /*
   * Dikelompokkan memakai kolom `group`, bukan tanda bilangannya: seluruh nilai
   * di rincian disimpan positif, jadi memilah berdasarkan tanda menempatkan
   * PPh 21 dan iuran BPJS di daftar pendapatan.
   */
  const pendapatan = data.rincian.filter((r) => r.group === 'EARNING');
  const potongan = data.rincian.filter((r) => r.group === 'DEDUCTION');
  const perusahaan = data.rincian.filter((r) => r.group === 'EMPLOYER' && r.amount > 0);

  return (
    <Kertas>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: jarak.lg,
          paddingTop: ruangAtas + jarak.sm,
          paddingBottom: jarak.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── kepala slip: yang dicari duluan, berapa yang masuk rekening ── */}
        <Muncul>
          <Sobekan>
            <Kolom atas>Diterima</Kolom>
            <Uang nilai={rupiah(data.netPay)} style={{ marginTop: jarak.sm }} />

            <Garis style={{ marginTop: jarak.lg, marginBottom: jarak.md }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Kolom>Dibayarkan</Kolom>
                <Badan style={{ fontSize: 13.5, marginTop: 3 }}>{tanggal(data.run.payDate)}</Badan>
              </View>
              <View style={{ flex: 1 }}>
                <Kolom>Ke rekening</Kolom>
                <Badan style={{ fontSize: 13.5, marginTop: 3 }}>
                  {data.employee.bankName ?? '—'}
                  {data.employee.bankAccount ? ` ···${data.employee.bankAccount.slice(-4)}` : ''}
                </Badan>
              </View>
            </View>
          </Sobekan>
        </Muncul>

        {data.run.kind === 'THR' ? (
          <Muncul jeda={50}>
            <View style={{ flexDirection: 'row', gap: jarak.sm, marginTop: jarak.lg }}>
              <View style={{ width: 2, backgroundColor: t.aksen, borderRadius: 1 }} />
              <View style={{ flex: 1 }}>
                <Kolom atas>Tunjangan hari raya</Kolom>
                <Badan style={{ fontSize: 13.5, marginTop: 3, lineHeight: 20 }}>
                  Masa kerja {data.serviceMonths} bulan. Dihitung menurut Permenaker 6/2016 —
                  masa kerja 12 bulan atau lebih berhak atas satu bulan upah penuh.
                </Badan>
              </View>
            </View>
          </Muncul>
        ) : null}

        {pendapatan.length ? (
          <Muncul jeda={80}>
            <View style={{ paddingTop: jarak.xl }}>
              <Kolom>Pendapatan</Kolom>
              <Garis tegas style={{ marginTop: jarak.sm }} />
              <View style={{ paddingTop: jarak.xs }}>
                {pendapatan.map((r, i) => (
                  <BarisBuku key={`${r.label}-${i}`} kiri={r.label} kanan={rupiah(r.amount)} />
                ))}
                <Garis />
                <BarisBuku kiri="Bruto" kanan={rupiah(data.grossPay)} tebal />
              </View>
            </View>
          </Muncul>
        ) : null}

        {potongan.length ? (
          <Muncul jeda={130}>
            <View style={{ paddingTop: jarak.xl }}>
              <Kolom>Potongan</Kolom>
              <Garis tegas style={{ marginTop: jarak.sm }} />
              <View style={{ paddingTop: jarak.xs }}>
                {potongan.map((r, i) => (
                  <BarisBuku
                    key={`${r.label}-${i}`}
                    kiri={r.label}
                    kanan={`− ${rupiah(r.amount)}`}
                    warna={t.negatif}
                  />
                ))}
                <Garis />
                <BarisBuku
                  kiri="Total potongan"
                  kanan={`− ${rupiah(data.totalDeduction)}`}
                  tebal
                  warna={t.negatif}
                />
              </View>
            </View>
          </Muncul>
        ) : null}

        {perusahaan.length ? (
          <Muncul jeda={180}>
            <View style={{ paddingTop: jarak.xl }}>
              <Kolom>Ditanggung perusahaan</Kolom>
              <Garis tegas style={{ marginTop: jarak.sm }} />
              <View style={{ paddingTop: jarak.xs }}>
                {perusahaan.map((r, i) => (
                  <BarisBuku key={`${r.label}-${i}`} kiri={r.label} kanan={rupiah(r.amount)} />
                ))}
              </View>
              <Badan style={{ fontSize: 12.5, marginTop: jarak.sm, lineHeight: 19 }}>
                Iuran ini dibayar perusahaan di luar gaji Anda, jadi tidak mengurangi jumlah
                yang diterima.
              </Badan>
            </View>
          </Muncul>
        ) : null}

        <Muncul jeda={230}>
          <View style={{ paddingTop: jarak.xl }}>
            <Kolom>Pajak & kehadiran</Kolom>
            <Garis tegas style={{ marginTop: jarak.sm }} />
            <View style={{ paddingTop: jarak.xs }}>
              <BarisBuku kiri="PPh 21" kanan={rupiah(data.pph21)} />
              <BarisBuku
                kiri="Metode"
                kanan={data.taxMethod === 'TER' ? 'TER bulanan' : 'Progresif tahunan'}
              />
              <BarisBuku kiri="Status PTKP" kanan={data.employee.ptkpStatus} />
              {data.run.kind !== 'THR' ? (
                <>
                  <BarisBuku kiri="Hari hadir" kanan={`${data.presentDays} hari`} />
                  {data.overtimeHours > 0 ? (
                    <BarisBuku kiri="Jam lembur" kanan={`${data.overtimeHours} jam`} />
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
        </Muncul>

        <Garis tegas style={{ marginTop: jarak.xl }} />
        <Text
          style={[
            teks.kolom,
            { color: t.tintaPudar, textAlign: 'center', marginTop: jarak.lg, lineHeight: 17, opacity: 0.8 },
          ]}
        >
          {data.employee.fullName} · {data.employee.employeeNo}{'\n'}
          DITERBITKAN OTOMATIS, TANPA TANDA TANGAN
        </Text>
      </ScrollView>
    </Kertas>
  );
}
