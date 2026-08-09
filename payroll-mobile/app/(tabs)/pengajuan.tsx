import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, ApiError, type Cuti, type Kuota, type Lembur } from '../../src/api';
import { isoHariIni, rupiah, tanggal } from '../../src/format';
import {
  Bagian, Badan, Galat, Kartu, Kosong, Label, Lencana, MemuatLayar, Muncul,
  Panel, Tekan, Tombol, useRuangBawah, useTema,
} from '../../src/ui';
import { getar } from '../../src/getar';
import { HURUF, jarak, lengkung, tabular, teks, SENTUH } from '../../src/theme';

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
  if (!cuti || !lembur) return <MemuatLayar baris={4} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.latar }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: ruangBawah + 70 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={segar}
            tintColor={t.tintaRedup}
            onRefresh={async () => { setSegar(true); await muat(); setSegar(false); }}
          />
        }
      >
        <Panel style={{ paddingBottom: jarak.lg }}>
          <Text style={[teks.sedang, { color: '#ffffff' }]}>Pengajuan</Text>

          {/* pengalih tersegmen di dalam panel */}
          <View
            style={{
              flexDirection: 'row', marginTop: jarak.lg, padding: 5,
              backgroundColor: t.panelIsian, borderRadius: lengkung.pil,
            }}
          >
            {(['cuti', 'lembur'] as const).map((k) => {
              const aktif = tab === k;
              return (
                <Tekan
                  key={k}
                  onPress={() => setTab(k)}
                  style={{ flex: 1 }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: aktif }}
                >
                  <View
                    style={{
                      minHeight: 38, alignItems: 'center', justifyContent: 'center',
                      borderRadius: lengkung.pil,
                      backgroundColor: aktif ? '#ffffff' : 'transparent',
                    }}
                  >
                    <Text
                      style={[
                        teks.sedang,
                        { color: aktif ? t.panel[1] : 'rgba(255,255,255,0.7)', fontSize: 14 },
                      ]}
                    >
                      {k === 'cuti' ? 'Cuti' : 'Lembur'}
                    </Text>
                  </View>
                </Tekan>
              );
            })}
          </View>
        </Panel>

        <View style={{ padding: jarak.lg, gap: jarak.md }}>
          {tab === 'cuti' ? (
            <>
              {kuota ? (
                <Muncul>
                  <Kartu putih>
                    <Label>Sisa cuti tahunan</Label>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                      <Text style={[teks.saldoKecil, tabular, { color: t.tinta }]}>{kuota.sisa}</Text>
                      <Badan style={{ fontSize: 13 }}>
                        dari {kuota.kuota} hari · {kuota.terpakai} terpakai
                      </Badan>
                    </View>
                    <View
                      style={{
                        height: 6, borderRadius: 999, backgroundColor: t.lembut,
                        marginTop: jarak.md, overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: 6, borderRadius: 999, backgroundColor: t.merek,
                          width: `${Math.min(100, (kuota.terpakai / Math.max(1, kuota.kuota)) * 100)}%`,
                        }}
                      />
                    </View>
                  </Kartu>
                </Muncul>
              ) : null}

              {cuti.length === 0 ? (
                <Kosong
                  pesan="Belum ada pengajuan cuti. Ketuk tombol di bawah untuk mengajukan."
                  ikon="sunny-outline"
                />
              ) : (
                <>
                  <Bagian judul="Riwayat" />
                  {cuti.map((c, i) => (
                    <Muncul key={c.id} jeda={i * 50}>
                      <Kartu putih style={{ marginBottom: jarak.md }}>
                        <View
                          style={{
                            flexDirection: 'row', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: jarak.md,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[teks.sedang, { color: t.tinta }]}>
                              {NAMA_CUTI[c.type] ?? c.type} · {c.days} hari
                            </Text>
                            <Text style={[teks.kecil, tabular, { color: t.tintaRedup, marginTop: 3 }]}>
                              {tanggal(c.startDate)} – {tanggal(c.endDate)}
                            </Text>
                          </View>
                          <Lencana status={c.status} />
                        </View>

                        <Badan style={{ fontSize: 13.5, marginTop: jarak.sm }}>{c.reason}</Badan>

                        {c.reviewNote ? (
                          <View
                            style={{
                              marginTop: jarak.sm, padding: jarak.md,
                              borderRadius: lengkung.md, backgroundColor: t.lembut,
                            }}
                          >
                            <Label>Catatan {c.reviewedBy ?? 'peninjau'}</Label>
                            <Badan style={{ fontSize: 13, marginTop: 2 }}>{c.reviewNote}</Badan>
                          </View>
                        ) : null}
                      </Kartu>
                    </Muncul>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {lembur.length === 0 ? (
                <Kosong
                  pesan="Belum ada pengajuan lembur. Ketuk tombol di bawah untuk mengajukan."
                  ikon="moon-outline"
                />
              ) : (
                <>
                  <Bagian judul="Riwayat" />
                  {lembur.map((l, i) => (
                    <Muncul key={l.id} jeda={i * 50}>
                      <Kartu putih style={{ marginBottom: jarak.md }}>
                        <View
                          style={{
                            flexDirection: 'row', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: jarak.md,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[teks.sedang, { color: t.tinta }]}>
                              {l.hours} jam{l.isHoliday ? ' · hari libur' : ''}
                            </Text>
                            <Text style={[teks.kecil, tabular, { color: t.tintaRedup, marginTop: 3 }]}>
                              {tanggal(l.date)}
                            </Text>
                          </View>
                          <Lencana status={l.status} />
                        </View>

                        <Badan style={{ fontSize: 13.5, marginTop: jarak.sm }}>{l.reason}</Badan>

                        {l.status === 'APPROVED' && l.amount > 0 ? (
                          <Text style={[teks.sedang, tabular, { color: t.naik, marginTop: jarak.sm }]}>
                            {rupiah(l.amount)}
                          </Text>
                        ) : null}
                      </Kartu>
                    </Muncul>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* tombol ajukan, mengambang di atas bilah tab */}
      <View style={{ position: 'absolute', left: jarak.lg, right: jarak.lg, bottom: ruangBawah }}>
        <Tombol
          judul={`Ajukan ${tab === 'cuti' ? 'cuti' : 'lembur'}`}
          onPress={() => setFormulir(tab)}
          ikon={<Ionicons name="add" size={19} color="#ffffff" />}
        />
      </View>

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

function Bungkus({
  judul, tutup, children,
}: { judul: string; tutup: () => void; children: React.ReactNode }) {
  const t = useTema();
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={tutup}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: t.latar }}
      >
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: jarak.lg,
          }}
        >
          <Text style={[teks.kepala, { color: t.tinta }]}>{judul}</Text>
          <Tekan onPress={tutup} hitSlop={14} getarkan={false}>
            <View
              style={{
                width: 34, height: 34, borderRadius: 999,
                backgroundColor: t.lembut, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={19} color={t.tintaSedang} />
            </View>
          </Tekan>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: jarak.lg, paddingTop: 0, gap: jarak.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Isian({
  label, nilai, ubah, petunjuk, banyakBaris, jenisPapan, ikon,
}: {
  label: string; nilai: string; ubah: (v: string) => void;
  petunjuk?: string; banyakBaris?: boolean; jenisPapan?: 'numeric' | 'default';
  ikon?: keyof typeof Ionicons.glyphMap;
}) {
  const t = useTema();
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <View
        style={{
          flexDirection: 'row', alignItems: banyakBaris ? 'flex-start' : 'center',
          gap: jarak.sm, backgroundColor: t.lembut,
          borderRadius: lengkung.md, paddingHorizontal: jarak.md,
          paddingVertical: banyakBaris ? jarak.md : 0,
        }}
      >
        {ikon ? <Ionicons name={ikon} size={17} color={t.tintaRedup} style={{ marginTop: banyakBaris ? 3 : 0 }} /> : null}
        <TextInput
          value={nilai}
          onChangeText={ubah}
          placeholder={petunjuk}
          placeholderTextColor={t.tintaRedup}
          multiline={banyakBaris}
          keyboardType={jenisPapan ?? 'default'}
          style={{
            flex: 1,
            minHeight: banyakBaris ? 80 : SENTUH,
            color: t.tinta,
            fontSize: 15.5,
            textAlignVertical: banyakBaris ? 'top' : 'center',
          }}
        />
      </View>
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
      <View style={{ gap: 6 }}>
        <Label>Jenis cuti</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: jarak.sm }}>
          {JENIS_CUTI.map((j) => {
            const aktif = jenis === j.nilai;
            return (
              <Tekan key={j.nilai} onPress={() => setJenis(j.nilai)}>
                <View
                  style={{
                    minHeight: 40, paddingHorizontal: jarak.lg, justifyContent: 'center',
                    borderRadius: lengkung.pil,
                    backgroundColor: aktif ? t.merek : t.lembut,
                  }}
                >
                  <Text style={[teks.kecil, { color: aktif ? '#ffffff' : t.tintaSedang, fontFamily: HURUF.tebal }]}>
                    {j.label}
                  </Text>
                </View>
              </Tekan>
            );
          })}
        </View>
      </View>

      <Isian label="Tanggal mulai" nilai={mulai} ubah={setMulai} petunjuk="2026-08-10" ikon="calendar-outline" />
      <Isian label="Tanggal selesai" nilai={akhir} ubah={setAkhir} petunjuk="2026-08-12" ikon="calendar-outline" />
      <Isian
        label="Alasan"
        nilai={alasan}
        ubah={setAlasan}
        petunjuk="Ditulis singkat, minimal 6 karakter"
        banyakBaris
        ikon="chatbox-outline"
      />

      {galat ? (
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.turunLembut,
          }}
        >
          <Ionicons name="alert-circle" size={16} color={t.turun} />
          <Text style={[teks.kecil, { color: t.turun, flex: 1 }]}>{galat}</Text>
        </View>
      ) : null}

      <Tombol judul="Kirim pengajuan" onPress={kirim} memuat={sibuk} />
      <Text style={[teks.kecil, { color: t.tintaRedup, textAlign: 'center', fontSize: 11.5 }]}>
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
      <Isian label="Tanggal" nilai={tgl} ubah={setTgl} petunjuk="2026-08-10" ikon="calendar-outline" />
      <Isian label="Jumlah jam" nilai={jam} ubah={setJam} petunjuk="2" jenisPapan="numeric" ikon="time-outline" />
      <Isian
        label="Alasan"
        nilai={alasan}
        ubah={setAlasan}
        petunjuk="Ditulis singkat, minimal 6 karakter"
        banyakBaris
        ikon="chatbox-outline"
      />

      {perkiraan !== null ? (
        <Kartu putih>
          <Label>Perkiraan upah lembur</Label>
          <Text style={[teks.saldoKecil, tabular, { color: t.naik, marginTop: 3 }]}>
            {rupiah(perkiraan)}
          </Text>
          <Badan style={{ fontSize: 12, marginTop: 5, lineHeight: 18 }}>
            Perhitungan Kepmenaker 102/2004. Nilai pastinya dikunci saat disetujui.
          </Badan>
        </Kartu>
      ) : null}

      {galat ? (
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.turunLembut,
          }}
        >
          <Ionicons name="alert-circle" size={16} color={t.turun} />
          <Text style={[teks.kecil, { color: t.turun, flex: 1 }]}>{galat}</Text>
        </View>
      ) : null}

      <Tombol judul="Kirim pengajuan" onPress={kirim} memuat={sibuk} />
    </Bungkus>
  );
}
