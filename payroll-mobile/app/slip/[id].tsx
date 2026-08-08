import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { api, ApiError, type SlipDetail } from '../../src/api';
import { namaPeriode, rupiah, tanggal } from '../../src/format';
import { Baris, Galat, Garis, Kartu, Label, Lencana, MemuatDaftar, Muncul, useTema } from '../../src/ui';
import { jarak, lengkung, teks } from '../../src/theme';

export default function RincianSlip() {
  const t = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [data, setData] = useState<SlipDetail | null>(null);
  const [galat, setGalat] = useState('');

  const muat = useCallback(async () => {
    try { setData(await api.slipDetail(String(id))); setGalat(''); }
    catch (e) { setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.'); }
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
  if (!data) return <MemuatDaftar jumlah={3} baris={5} />;

  // Dikelompokkan memakai kolom `group`, bukan tanda bilangannya: seluruh
  // nilai di rincian disimpan positif, jadi memilah berdasarkan tanda
  // menempatkan PPh 21 dan iuran BPJS di daftar pendapatan.
  const pendapatan = data.rincian.filter((r) => r.group === 'EARNING');
  const potongan = data.rincian.filter((r) => r.group === 'DEDUCTION');
  const perusahaan = data.rincian.filter((r) => r.group === 'EMPLOYER' && r.amount > 0);

  return (
    <ScrollView contentContainerStyle={{ padding: jarak.lg, gap: jarak.md, paddingBottom: jarak.xxl }}>
      {/* yang paling dicari duluan: berapa yang masuk rekening */}
      <Muncul>
      <Kartu>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Diterima</Label>
          <Lencana status={data.transferStatus} />
        </View>
        <Text style={{ fontSize: 32, fontWeight: '700', color: t.kuat, letterSpacing: -1, marginTop: 4, fontVariant: ['tabular-nums'] }}>
          {rupiah(data.netPay)}
        </Text>
        <Text style={[teks.badan, { color: t.redup, marginTop: 4 }]}>
          Dibayarkan {tanggal(data.run.payDate)}
          {data.employee.bankName ? ` ke ${data.employee.bankName}` : ''}
          {data.employee.bankAccount ? ` ···${data.employee.bankAccount.slice(-4)}` : ''}
        </Text>
      </Kartu>
      </Muncul>

      {data.run.kind === 'THR' ? (
        <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.aksenLembut }}>
          <Text style={[teks.label, { color: t.aksen }]}>
            Tunjangan hari raya · masa kerja {data.serviceMonths} bulan
          </Text>
          <Text style={[teks.mikro, { color: t.aksen, marginTop: 4 }]}>
            Dihitung menurut Permenaker 6/2016. Masa kerja 12 bulan atau lebih
            berhak atas satu bulan upah penuh.
          </Text>
        </View>
      ) : null}

      {pendapatan.length ? (
        <Muncul jeda={60}>
        <Kartu>
          <Label>Pendapatan</Label>
          <View style={{ marginTop: jarak.sm }}>
            {pendapatan.map((r, i) => (
              <View key={`${r.label}-${i}`}>
                {i > 0 ? <Garis /> : null}
                <Baris kiri={r.label} kanan={rupiah(r.amount)} />
              </View>
            ))}
            <Garis />
            <Baris kiri="Bruto" kanan={rupiah(data.grossPay)} tebal />
          </View>
        </Kartu>
        </Muncul>
      ) : null}

      {potongan.length ? (
        <Muncul jeda={120}>
        <Kartu>
          <Label>Potongan</Label>
          <View style={{ marginTop: jarak.sm }}>
            {potongan.map((r, i) => (
              <View key={`${r.label}-${i}`}>
                {i > 0 ? <Garis /> : null}
                <Baris kiri={r.label} kanan={rupiah(r.amount)} warna={t.bahaya} />
              </View>
            ))}
            <Garis />
            <Baris kiri="Total potongan" kanan={rupiah(data.totalDeduction)} tebal warna={t.bahaya} />
          </View>
        </Kartu>
        </Muncul>
      ) : null}

      {perusahaan.length ? (
        <Muncul jeda={160}>
        <Kartu>
          <Label>Ditanggung perusahaan</Label>
          <View style={{ marginTop: jarak.sm }}>
            {perusahaan.map((r, i) => (
              <View key={`${r.label}-${i}`}>
                {i > 0 ? <Garis /> : null}
                <Baris kiri={r.label} kanan={rupiah(r.amount)} />
              </View>
            ))}
          </View>
          <Text style={[teks.mikro, { color: t.redup, marginTop: jarak.md }]}>
            Iuran ini dibayar perusahaan di luar gaji Anda, jadi tidak mengurangi
            jumlah yang diterima.
          </Text>
        </Kartu>
        </Muncul>
      ) : null}

      <Kartu>
        <Label>Pajak & kehadiran</Label>
        <View style={{ marginTop: jarak.sm }}>
          <Baris kiri="PPh 21" kanan={rupiah(data.pph21)} />
          <Garis />
          <Baris kiri="Metode" kanan={data.taxMethod === 'TER' ? 'TER bulanan' : 'Progresif tahunan'} />
          <Garis />
          <Baris kiri="Status PTKP" kanan={data.employee.ptkpStatus} />
          {data.run.kind !== 'THR' ? (
            <>
              <Garis />
              <Baris kiri="Hari hadir" kanan={`${data.presentDays} hari`} />
              {data.overtimeHours > 0 ? (
                <>
                  <Garis />
                  <Baris kiri="Jam lembur" kanan={`${data.overtimeHours} jam`} />
                </>
              ) : null}
            </>
          ) : null}
        </View>
      </Kartu>

      <Text style={[teks.mikro, { color: t.redup, textAlign: 'center' }]}>
        {data.employee.fullName} · {data.employee.employeeNo}
        {'\n'}Slip ini diterbitkan otomatis dan tidak memerlukan tanda tangan.
      </Text>
    </ScrollView>
  );
}
