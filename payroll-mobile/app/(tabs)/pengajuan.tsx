import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type Cuti, type Kuota, type Lembur } from '../../src/api';
import { isoHariIni, rupiah, tanggal } from '../../src/format';
import { Badan, Galat, Kartu, Kosong, Label, Lencana, Memuat, Tombol, useTema } from '../../src/ui';
import { jarak, lengkung, teks } from '../../src/theme';

const JENIS_CUTI: { nilai: string; label: string }[] = [
  { nilai: 'ANNUAL', label: 'Tahunan' },
  { nilai: 'SICK', label: 'Sakit' },
  { nilai: 'UNPAID', label: 'Tanpa upah' },
  { nilai: 'MATERNITY', label: 'Melahirkan' },
  { nilai: 'SPECIAL', label: 'Penting' },
];

const NAMA_CUTI: Record<string, string> = Object.fromEntries(JENIS_CUTI.map((j) => [j.nilai, j.label]));

/** yyyy-mm-dd hari ini. Memakai toISOString() akan memberi tanggal kemarin
 *  bagi pengguna WIB sebelum pukul 07.00, karena itu tanggal UTC. */
const hariIniISO = isoHariIni;

export default function LayarPengajuan() {
  const t = useTema();
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
  if (!cuti || !lembur) return <Memuat />;

  return (
    <View style={{ flex: 1 }}>
      {/* pengalih */}
      <View style={{ flexDirection: 'row', gap: jarak.sm, padding: jarak.lg, paddingBottom: jarak.sm }}>
        {(['cuti', 'lembur'] as const).map((k) => {
          const aktif = tab === k;
          return (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={{
                flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center',
                borderRadius: lengkung.md, borderWidth: 1,
                backgroundColor: aktif ? t.aksenLembut : 'transparent',
                borderColor: aktif ? t.aksen : t.kartuTepi,
              }}
            >
              <Text style={[teks.label, { color: aktif ? t.aksen : t.redup }]}>
                {k === 'cuti' ? 'Cuti' : 'Lembur'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: jarak.lg, paddingTop: jarak.sm, gap: jarak.md, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={segar} tintColor={t.aksen}
            onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }} />
        }
      >
        {tab === 'cuti' ? (
          <>
            {kuota ? (
              <Kartu>
                <Label>Sisa cuti tahunan</Label>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <Text style={[teks.judul, { color: t.kuat }]}>{kuota.sisa}</Text>
                  <Badan>dari {kuota.kuota} hari · {kuota.terpakai} terpakai</Badan>
                </View>
                {/* bilah sederhana, bukan grafik — informasinya cuma satu angka */}
                <View style={{ height: 6, borderRadius: 999, backgroundColor: t.isian, marginTop: jarak.md, overflow: 'hidden' }}>
                  <View style={{
                    height: 6, borderRadius: 999, backgroundColor: t.aksen,
                    width: `${Math.min(100, (kuota.terpakai / Math.max(1, kuota.kuota)) * 100)}%`,
                  }} />
                </View>
              </Kartu>
            ) : null}

            {cuti.length === 0 ? (
              <Kosong pesan="Belum ada pengajuan cuti." />
            ) : cuti.map((c) => (
              <Kartu key={c.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: jarak.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[teks.sedang, { color: t.kuat }]}>
                      {NAMA_CUTI[c.type] ?? c.type} · {c.days} hari
                    </Text>
                    <Badan style={{ fontSize: 12, marginTop: 2 }}>
                      {tanggal(c.startDate)} – {tanggal(c.endDate)}
                    </Badan>
                  </View>
                  <Lencana status={c.status} />
                </View>
                <Badan style={{ marginTop: jarak.sm }}>{c.reason}</Badan>
                {c.reviewNote ? (
                  <View style={{ marginTop: jarak.sm, padding: jarak.sm, borderRadius: lengkung.sm, backgroundColor: t.isian }}>
                    <Text style={[teks.mikro, { color: t.redup }]}>Catatan {c.reviewedBy ?? 'peninjau'}</Text>
                    <Badan style={{ fontSize: 13, marginTop: 2 }}>{c.reviewNote}</Badan>
                  </View>
                ) : null}
              </Kartu>
            ))}
          </>
        ) : (
          <>
            {lembur.length === 0 ? (
              <Kosong pesan="Belum ada pengajuan lembur." />
            ) : lembur.map((l) => (
              <Kartu key={l.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: jarak.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[teks.sedang, { color: t.kuat }]}>
                      {l.hours} jam{l.isHoliday ? ' · hari libur' : ''}
                    </Text>
                    <Badan style={{ fontSize: 12, marginTop: 2 }}>{tanggal(l.date)}</Badan>
                  </View>
                  <Lencana status={l.status} />
                </View>
                <Badan style={{ marginTop: jarak.sm }}>{l.reason}</Badan>
                {l.status === 'APPROVED' && l.amount > 0 ? (
                  <Text style={[teks.sedang, { color: t.aksen, marginTop: jarak.sm }]}>
                    {rupiah(l.amount)}
                  </Text>
                ) : null}
              </Kartu>
            ))}
          </>
        )}
      </ScrollView>

      {/* tombol apung */}
      <Pressable
        onPress={() => setFormulir(tab)}
        style={({ pressed }) => ({
          position: 'absolute', right: jarak.lg, bottom: jarak.lg,
          minHeight: 52, paddingHorizontal: jarak.lg, borderRadius: 999,
          backgroundColor: t.aksen, flexDirection: 'row', alignItems: 'center', gap: jarak.sm,
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
        })}
      >
        <Ionicons name="add" size={20} color={t.aksenTeks} />
        <Text style={[teks.sedang, { color: t.aksenTeks }]}>
          Ajukan {tab === 'cuti' ? 'cuti' : 'lembur'}
        </Text>
      </Pressable>

      {formulir === 'cuti' ? (
        <FormulirCuti tutup={() => setFormulir(null)} selesai={async () => { setFormulir(null); await muat(); }} />
      ) : null}
      {formulir === 'lembur' ? (
        <FormulirLembur tutup={() => setFormulir(null)} selesai={async () => { setFormulir(null); await muat(); }} />
      ) : null}
    </View>
  );
}

// ─────────────────────────── formulir ───────────────────────────

function Bungkus({ judul, tutup, children }: { judul: string; tutup: () => void; children: React.ReactNode }) {
  const t = useTema();
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={tutup}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          padding: jarak.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.kartuTepi,
        }}>
          <Text style={[teks.kepala, { color: t.kuat }]}>{judul}</Text>
          <Pressable onPress={tutup} hitSlop={12}><Ionicons name="close" size={24} color={t.badan} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: jarak.lg, gap: jarak.lg }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Isian({ label, nilai, ubah, petunjuk, banyakBaris, jenisPapan }: {
  label: string; nilai: string; ubah: (v: string) => void; petunjuk?: string;
  banyakBaris?: boolean; jenisPapan?: 'numeric' | 'default';
}) {
  const t = useTema();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[teks.label, { color: t.badan }]}>{label}</Text>
      <TextInput
        value={nilai}
        onChangeText={ubah}
        placeholder={petunjuk}
        placeholderTextColor={t.redup}
        multiline={banyakBaris}
        keyboardType={jenisPapan ?? 'default'}
        style={{
          minHeight: banyakBaris ? 90 : 50,
          borderWidth: 1, borderColor: t.isianTepi, backgroundColor: t.isian,
          borderRadius: lengkung.md, padding: jarak.md, color: t.kuat, fontSize: 15.5,
          textAlignVertical: banyakBaris ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function FormulirCuti({ tutup, selesai }: { tutup: () => void; selesai: () => void }) {
  const t = useTema();
  const [jenis, setJenis] = useState('ANNUAL');
  const [mulai, setMulai] = useState(hariIniISO());
  const [akhir, setAkhir] = useState(hariIniISO());
  const [alasan, setAlasan] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  async function kirim() {
    setSibuk(true); setGalat('');
    try {
      const r = await api.ajukanCuti({ type: jenis, startDate: mulai, endDate: akhir, reason: alasan });
      Alert.alert('Terkirim', r.pesan);
      selesai();
    } catch (e) {
      // Pesan penolakan datang dari aturan yang sama dengan web — sisa kuota,
      // tumpang tindih tanggal — jadi ditampilkan apa adanya.
      setGalat(e instanceof ApiError ? e.message : 'Pengajuan gagal.');
    } finally { setSibuk(false); }
  }

  return (
    <Bungkus judul="Ajukan cuti" tutup={tutup}>
      <View style={{ gap: 6 }}>
        <Text style={[teks.label, { color: t.badan }]}>Jenis cuti</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: jarak.sm }}>
          {JENIS_CUTI.map((j) => {
            const aktif = jenis === j.nilai;
            return (
              <Pressable
                key={j.nilai}
                onPress={() => setJenis(j.nilai)}
                style={{
                  minHeight: 40, paddingHorizontal: jarak.md, justifyContent: 'center',
                  borderRadius: lengkung.md, borderWidth: 1,
                  backgroundColor: aktif ? t.aksenLembut : 'transparent',
                  borderColor: aktif ? t.aksen : t.isianTepi,
                }}
              >
                <Text style={[teks.label, { color: aktif ? t.aksen : t.badan }]}>{j.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Isian label="Tanggal mulai" nilai={mulai} ubah={setMulai} petunjuk="2026-08-10" />
      <Isian label="Tanggal selesai" nilai={akhir} ubah={setAkhir} petunjuk="2026-08-12" />
      <Isian label="Alasan" nilai={alasan} ubah={setAlasan} petunjuk="Ditulis singkat, minimal 6 karakter" banyakBaris />

      {galat ? (
        <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.bahayaLembut }}>
          <Text style={[teks.badan, { color: t.bahaya }]}>{galat}</Text>
        </View>
      ) : null}

      <Tombol judul="Kirim pengajuan" onPress={kirim} memuat={sibuk} />
      <Text style={[teks.mikro, { color: t.redup, textAlign: 'center' }]}>
        Hanya hari kerja Senin–Jumat yang dihitung.
      </Text>
    </Bungkus>
  );
}

function FormulirLembur({ tutup, selesai }: { tutup: () => void; selesai: () => void }) {
  const t = useTema();
  const [tgl, setTgl] = useState(hariIniISO());
  const [jam, setJam] = useState('2');
  const [alasan, setAlasan] = useState('');
  const [perkiraan, setPerkiraan] = useState<number | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  // Perkiraan rupiah dihitung di server memakai rumus Kepmenaker yang sama
  // dengan proses gaji — bukan taksiran terpisah di ponsel yang bisa berbeda.
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
      Alert.alert('Terkirim', r.pesan);
      selesai();
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Pengajuan gagal.');
    } finally { setSibuk(false); }
  }

  return (
    <Bungkus judul="Ajukan lembur" tutup={tutup}>
      <Isian label="Tanggal" nilai={tgl} ubah={setTgl} petunjuk="2026-08-10" />
      <Isian label="Jumlah jam" nilai={jam} ubah={setJam} petunjuk="2" jenisPapan="numeric" />
      <Isian label="Alasan" nilai={alasan} ubah={setAlasan} petunjuk="Ditulis singkat, minimal 6 karakter" banyakBaris />

      {perkiraan !== null ? (
        <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.aksenLembut }}>
          <Text style={[teks.mikro, { color: t.aksen, textTransform: 'uppercase' }]}>Perkiraan upah lembur</Text>
          <Text style={[teks.kepala, { color: t.aksen, marginTop: 2 }]}>{rupiah(perkiraan)}</Text>
          <Text style={[teks.mikro, { color: t.aksen, marginTop: 4 }]}>
            Perhitungan Kepmenaker 102/2004. Nilai pastinya dikunci saat disetujui.
          </Text>
        </View>
      ) : null}

      {galat ? (
        <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.bahayaLembut }}>
          <Text style={[teks.badan, { color: t.bahaya }]}>{galat}</Text>
        </View>
      ) : null}

      <Tombol judul="Kirim pengajuan" onPress={kirim} memuat={sibuk} />
    </Bungkus>
  );
}
