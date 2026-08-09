import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type Cuti, type Kuota, type Lembur } from '../../src/api';
import { isoHariIni, rupiah, tanggal } from '../../src/format';
import {
  Badan, Galat, Garis, Kertas, Kolom, Kosong, MemuatDaftar, Muncul, Status,
  Tekan, Tombol, useRuangAtas, useRuangBawah, useTema,
} from '../../src/ui';
import { getar } from '../../src/getar';
import { angka, jarak, lengkung, teks, SENTUH } from '../../src/theme';

const JENIS_CUTI = [
  { nilai: 'ANNUAL', label: 'Tahunan' },
  { nilai: 'SICK', label: 'Sakit' },
  { nilai: 'UNPAID', label: 'Tanpa upah' },
  { nilai: 'MATERNITY', label: 'Melahirkan' },
  { nilai: 'SPECIAL', label: 'Penting' },
] as const;

const NAMA_CUTI: Record<string, string> = Object.fromEntries(JENIS_CUTI.map((j) => [j.nilai, j.label]));

export default function LayarPengajuan() {
  const t = useTema();
  const ruangAtas = useRuangAtas();
  const ruangBawah = useRuangBawah();

  const [tab, setTab] = useState<'cuti' | 'lembur'>('cuti');
  const [cuti, setCuti] = useState<Cuti[] | null>(null);
  const [kuota, setKuota] = useState<Kuota | null>(null);
  const [lembur, setLembur] = useState<Lembur[] | null>(null);
  const [galat, setGalat] = useState('');
  const [segar, setSegar] = useState(false);
  const [formulir, setFormulir] = useState<'cuti' | 'lembur' | null>(null);

  const muat = useCallback(async () => {
    try {
      const [c, l] = await Promise.all([api.cuti(), api.lembur()]);
      setCuti(c.daftar);
      setKuota(c.kuota);
      setLembur(l.daftar);
      setGalat('');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal memuat.');
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  if (galat && !cuti) return <Galat pesan={galat} coba={muat} />;
  if (!cuti || !lembur) return <MemuatDaftar jumlah={4} />;

  return (
    <Kertas>
      <View style={{ flex: 1 }}>
        {/* ── pengalih: dua kata dengan garis penanda di bawahnya ── */}
        <View style={{ paddingHorizontal: jarak.lg, paddingTop: ruangAtas + jarak.sm }}>
          <View style={{ flexDirection: 'row', gap: jarak.xl }}>
            {(['cuti', 'lembur'] as const).map((k) => {
              const aktif = tab === k;
              return (
                <Tekan
                  key={k}
                  onPress={() => setTab(k)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: aktif }}
                >
                  <View style={{ paddingBottom: jarak.md }}>
                    <Text style={[teks.kepala, { color: aktif ? t.tinta : t.tintaPudar }]}>
                      {k === 'cuti' ? 'Cuti' : 'Lembur'}
                    </Text>
                    <View
                      style={{
                        height: 2,
                        marginTop: 7,
                        borderRadius: 1,
                        backgroundColor: aktif ? t.tinta : 'transparent',
                      }}
                    />
                  </View>
                </Tekan>
              );
            })}
          </View>
          <Garis tegas />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: jarak.lg,
            paddingBottom: ruangBawah + 60,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={segar}
              tintColor={t.tintaPudar}
              onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
            />
          }
        >
          {tab === 'cuti' ? (
            <>
              {kuota ? (
                <Muncul>
                  <View style={{ paddingVertical: jarak.lg }}>
                    <Kolom>Sisa cuti tahunan</Kolom>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                      <Text style={[teks.angkaBesar, angka, { color: t.tinta, fontSize: 38 }]}>
                        {kuota.sisa}
                      </Text>
                      <Badan style={{ fontSize: 13.5 }}>
                        dari {kuota.kuota} hari · {kuota.terpakai} terpakai
                      </Badan>
                    </View>
                  </View>
                  <Garis />
                </Muncul>
              ) : null}

              {cuti.length === 0 ? (
                <Kosong
                  pesan="Belum ada pengajuan cuti. Ketuk tombol di bawah untuk mengajukan."
                  ikon="sunny-outline"
                />
              ) : (
                cuti.map((c, i) => (
                  <Muncul key={c.id} jeda={i * 50}>
                    {i > 0 ? <Garis /> : null}
                    <View style={{ paddingVertical: jarak.lg }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: jarak.md }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[teks.sedang, { color: t.tinta }]}>
                            {NAMA_CUTI[c.type] ?? c.type} · {c.days} hari
                          </Text>
                          <Text style={[teks.kecil, angka, { color: t.tintaSedang, marginTop: 3 }]}>
                            {tanggal(c.startDate)} – {tanggal(c.endDate)}
                          </Text>
                        </View>
                        <Status status={c.status} />
                      </View>

                      <Badan style={{ fontSize: 13.5, marginTop: jarak.sm }}>{c.reason}</Badan>

                      {c.reviewNote ? (
                        <View style={{ flexDirection: 'row', gap: jarak.sm, marginTop: jarak.sm }}>
                          <View style={{ width: 2, backgroundColor: t.garisTegas, borderRadius: 1 }} />
                          <View style={{ flex: 1 }}>
                            <Kolom>Catatan {c.reviewedBy ?? 'peninjau'}</Kolom>
                            <Badan style={{ fontSize: 13, marginTop: 2 }}>{c.reviewNote}</Badan>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </Muncul>
                ))
              )}
              {cuti.length > 0 ? <Garis /> : null}
            </>
          ) : (
            <>
              {lembur.length === 0 ? (
                <Kosong
                  pesan="Belum ada pengajuan lembur. Ketuk tombol di bawah untuk mengajukan."
                  ikon="moon-outline"
                />
              ) : (
                lembur.map((l, i) => (
                  <Muncul key={l.id} jeda={i * 50}>
                    {i > 0 ? <Garis /> : null}
                    <View style={{ paddingVertical: jarak.lg }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: jarak.md }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[teks.sedang, { color: t.tinta }]}>
                            {l.hours} jam{l.isHoliday ? ' · hari libur' : ''}
                          </Text>
                          <Text style={[teks.kecil, angka, { color: t.tintaSedang, marginTop: 3 }]}>
                            {tanggal(l.date)}
                          </Text>
                        </View>
                        <Status status={l.status} />
                      </View>

                      <Badan style={{ fontSize: 13.5, marginTop: jarak.sm }}>{l.reason}</Badan>

                      {l.status === 'APPROVED' && l.amount > 0 ? (
                        <Text style={[teks.sedang, angka, { color: t.positif, marginTop: jarak.sm }]}>
                          {rupiah(l.amount)}
                        </Text>
                      ) : null}
                    </View>
                  </Muncul>
                ))
              )}
              {lembur.length > 0 ? <Garis /> : null}
            </>
          )}
        </ScrollView>

        {/* ── tombol ajukan, melekat di atas bilah tab ── */}
        <View
          style={{
            position: 'absolute',
            left: jarak.lg,
            right: jarak.lg,
            bottom: ruangBawah - jarak.sm,
          }}
        >
          <Tombol
            judul={`Ajukan ${tab === 'cuti' ? 'cuti' : 'lembur'}`}
            onPress={() => setFormulir(tab)}
            ikon={<Ionicons name="add" size={18} color={t.kertas} />}
          />
        </View>
      </View>

      {formulir === 'cuti' ? (
        <FormulirCuti tutup={() => setFormulir(null)} selesai={async () => { setFormulir(null); await muat(); }} />
      ) : null}
      {formulir === 'lembur' ? (
        <FormulirLembur tutup={() => setFormulir(null)} selesai={async () => { setFormulir(null); await muat(); }} />
      ) : null}
    </Kertas>
  );
}

// ─────────────────────────── formulir ───────────────────────────

function Bungkus({ judul, tutup, children }: { judul: string; tutup: () => void; children: React.ReactNode }) {
  const t = useTema();
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={tutup}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Kertas>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: jarak.lg,
              borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.garisTegas,
            }}
          >
            <Text style={[teks.kepala, { color: t.tinta }]}>{judul}</Text>
            <Tekan onPress={tutup} hitSlop={14}>
              <Ionicons name="close" size={23} color={t.tintaSedang} />
            </Tekan>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: jarak.lg, gap: jarak.lg }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Kertas>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Isian({
  label, nilai, ubah, petunjuk, banyakBaris, jenisPapan,
}: {
  label: string; nilai: string; ubah: (v: string) => void;
  petunjuk?: string; banyakBaris?: boolean; jenisPapan?: 'numeric' | 'default';
}) {
  const t = useTema();
  return (
    <View style={{ gap: jarak.sm }}>
      <Kolom>{label}</Kolom>
      <TextInput
        value={nilai}
        onChangeText={ubah}
        placeholder={petunjuk}
        placeholderTextColor={t.tintaPudar}
        multiline={banyakBaris}
        keyboardType={jenisPapan ?? 'default'}
        style={{
          minHeight: banyakBaris ? 88 : SENTUH,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: t.isianGaris,
          paddingVertical: jarak.sm,
          color: t.tinta,
          fontSize: 16,
          textAlignVertical: banyakBaris ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function FormulirCuti({ tutup, selesai }: { tutup: () => void; selesai: () => void }) {
  const t = useTema();
  const [jenis, setJenis] = useState<string>('ANNUAL');
  const [mulai, setMulai] = useState(isoHariIni());
  const [akhir, setAkhir] = useState(isoHariIni());
  const [alasan, setAlasan] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  async function kirim() {
    setSibuk(true); setGalat('');
    try {
      const r = await api.ajukanCuti({ type: jenis, startDate: mulai, endDate: akhir, reason: alasan });
      getar.berhasil();
      Alert.alert('Terkirim', r.pesan);
      selesai();
    } catch (e) {
      // Pesan penolakan datang dari aturan yang sama dengan web — sisa kuota,
      // tumpang tindih tanggal — jadi ditampilkan apa adanya.
      getar.gagal();
      setGalat(e instanceof ApiError ? e.message : 'Pengajuan gagal.');
    } finally { setSibuk(false); }
  }

  return (
    <Bungkus judul="Ajukan cuti" tutup={tutup}>
      <View style={{ gap: jarak.sm }}>
        <Kolom>Jenis cuti</Kolom>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: jarak.sm }}>
          {JENIS_CUTI.map((j) => {
            const aktif = jenis === j.nilai;
            return (
              <Tekan key={j.nilai} onPress={() => setJenis(j.nilai)}>
                <View
                  style={{
                    minHeight: 40, paddingHorizontal: jarak.md, justifyContent: 'center',
                    borderRadius: lengkung.sm,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: aktif ? t.tinta : t.garisTegas,
                    backgroundColor: aktif ? t.tinta : 'transparent',
                  }}
                >
                  <Text style={[teks.kecil, { color: aktif ? t.kertas : t.tintaSedang }]}>
                    {j.label}
                  </Text>
                </View>
              </Tekan>
            );
          })}
        </View>
      </View>

      <Isian label="Tanggal mulai" nilai={mulai} ubah={setMulai} petunjuk="2026-08-10" />
      <Isian label="Tanggal selesai" nilai={akhir} ubah={setAkhir} petunjuk="2026-08-12" />
      <Isian label="Alasan" nilai={alasan} ubah={setAlasan} petunjuk="Ditulis singkat, minimal 6 karakter" banyakBaris />

      {galat ? (
        <View style={{ flexDirection: 'row', gap: jarak.sm }}>
          <View style={{ width: 2, backgroundColor: t.negatif, borderRadius: 1 }} />
          <Text style={[teks.badan, { color: t.negatif, flex: 1 }]}>{galat}</Text>
        </View>
      ) : null}

      <Tombol judul="Kirim pengajuan" onPress={kirim} memuat={sibuk} />
      <Text style={[teks.kecil, { color: t.tintaPudar, textAlign: 'center' }]}>
        Hanya hari kerja Senin–Jumat yang dihitung.
      </Text>
    </Bungkus>
  );
}

function FormulirLembur({ tutup, selesai }: { tutup: () => void; selesai: () => void }) {
  const t = useTema();
  const [tgl, setTgl] = useState(isoHariIni());
  const [jam, setJam] = useState('2');
  const [alasan, setAlasan] = useState('');
  const [perkiraan, setPerkiraan] = useState<number | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  // Perkiraan rupiah dihitung di server memakai dasar upah dan aturan divisi
  // yang sama dengan proses gaji — bukan taksiran terpisah di ponsel.
  useEffect(() => {
    let batal = false;
    const n = Number(jam.replace(',', '.'));
    if (!tgl || !(n > 0)) { setPerkiraan(null); return; }
    const id = setTimeout(async () => {
      try {
        const r = await api.perkiraanLembur(tgl, n);
        if (!batal) setPerkiraan(r.perkiraan);
      } catch { if (!batal) setPerkiraan(null); }
    }, 400);
    return () => { batal = true; clearTimeout(id); };
  }, [tgl, jam]);

  async function kirim() {
    setSibuk(true); setGalat('');
    try {
      const r = await api.ajukanLembur({ date: tgl, hours: Number(jam.replace(',', '.')), reason: alasan });
      getar.berhasil();
      Alert.alert('Terkirim', r.pesan);
      selesai();
    } catch (e) {
      getar.gagal();
      setGalat(e instanceof ApiError ? e.message : 'Pengajuan gagal.');
    } finally { setSibuk(false); }
  }

  return (
    <Bungkus judul="Ajukan lembur" tutup={tutup}>
      <Isian label="Tanggal" nilai={tgl} ubah={setTgl} petunjuk="2026-08-10" />
      <Isian label="Jumlah jam" nilai={jam} ubah={setJam} petunjuk="2" jenisPapan="numeric" />
      <Isian label="Alasan" nilai={alasan} ubah={setAlasan} petunjuk="Ditulis singkat, minimal 6 karakter" banyakBaris />

      {perkiraan !== null ? (
        <View>
          <Garis tegas />
          <View style={{ paddingTop: jarak.md }}>
            <Kolom atas>Perkiraan upah lembur</Kolom>
            <Text style={[teks.angkaSedang, angka, { color: t.tinta, marginTop: 4 }]}>
              {rupiah(perkiraan)}
            </Text>
            <Badan style={{ fontSize: 12.5, marginTop: 5, lineHeight: 19 }}>
              Perhitungan Kepmenaker 102/2004. Nilai pastinya dikunci saat disetujui.
            </Badan>
          </View>
        </View>
      ) : null}

      {galat ? (
        <View style={{ flexDirection: 'row', gap: jarak.sm }}>
          <View style={{ width: 2, backgroundColor: t.negatif, borderRadius: 1 }} />
          <Text style={[teks.badan, { color: t.negatif, flex: 1 }]}>{galat}</Text>
        </View>
      ) : null}

      <Tombol judul="Kirim pengajuan" onPress={kirim} memuat={sibuk} />
    </Bungkus>
  );
}
