import { useState } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSesi } from '../src/auth';
import { ApiError, API } from '../src/api';
import { Garis, Kertas, Kolom, Tekan, Tombol, useTema } from '../src/ui';
import { jarak, teks, SENTUH } from '../src/theme';

export default function Masuk() {
  const t = useTema();
  const router = useRouter();
  const { masuk } = useSesi();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);

  async function kirim() {
    if (!email.trim() || !sandi) {
      setGalat('Surel dan kata sandi wajib diisi.');
      return;
    }
    setSibuk(true);
    setGalat('');
    try {
      await masuk(email.trim(), sandi);
      router.replace('/(tabs)');
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  /**
   * Isian bergaris bawah, bukan berkotak.
   *
   * Sejalan dengan konsep dokumen: formulir cetak punya garis untuk ditulisi,
   * bukan kotak. Sasaran sentuhnya tetap setinggi tombol.
   */
  const gayaIsian = {
    minHeight: SENTUH,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: t.isianGaris,
    paddingVertical: jarak.sm,
    color: t.tinta,
    fontSize: 16.5,
  };

  return (
    <Kertas>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: jarak.xl,
            paddingTop: insets.top + jarak.xxl,
            paddingBottom: insets.bottom + jarak.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── kepala ── */}
          <View style={{ marginBottom: jarak.xxl }}>
            <Kolom atas>Portal karyawan</Kolom>
            <Text
              style={[
                teks.judul,
                { color: t.tinta, fontSize: 40, letterSpacing: -1.4, marginTop: jarak.sm },
              ]}
            >
              Racik
            </Text>
            <Text style={[teks.badan, { color: t.tintaSedang, marginTop: 6, lineHeight: 22 }]}>
              Absen, slip gaji, cuti, dan lembur — semuanya di satu tempat.
            </Text>
            <Garis tegas style={{ marginTop: jarak.lg }} />
          </View>

          {/* ── isian ── */}
          <View style={{ gap: jarak.lg }}>
            <View style={{ gap: jarak.xs }}>
              <Kolom>Surel</Kolom>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="nama@perusahaan.id"
                placeholderTextColor={t.tintaPudar}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                style={gayaIsian}
              />
            </View>

            <View style={{ gap: jarak.xs }}>
              <Kolom>Kata sandi</Kolom>
              <TextInput
                value={sandi}
                onChangeText={setSandi}
                placeholder="••••••••"
                placeholderTextColor={t.tintaPudar}
                secureTextEntry
                textContentType="password"
                onSubmitEditing={kirim}
                returnKeyType="go"
                style={gayaIsian}
              />
            </View>

            {galat ? (
              <View style={{ flexDirection: 'row', gap: jarak.sm }}>
                <View style={{ width: 2, backgroundColor: t.negatif, borderRadius: 1 }} />
                <Text style={[teks.badan, { color: t.negatif, flex: 1 }]}>{galat}</Text>
              </View>
            ) : null}

            <Tombol judul="Masuk" onPress={kirim} memuat={sibuk} style={{ marginTop: jarak.sm }} />
          </View>

          {/* Akun contoh — proyek ini dipakai sebagai portofolio, jadi siapa pun
              yang membukanya harus bisa langsung masuk tanpa bertanya. */}
          <Tekan
            onPress={() => {
              setEmail('adit.prakoso@nusantaradigital.id');
              setSandi('password123');
            }}
            style={{ marginTop: jarak.xxl }}
          >
            <View>
              <Garis />
              <View style={{ paddingVertical: jarak.md }}>
                <Kolom>Akun contoh — ketuk untuk mengisi</Kolom>
                <Text style={[teks.badan, { color: t.tintaSedang, marginTop: 5 }]}>
                  adit.prakoso@nusantaradigital.id
                </Text>
                <Text style={[teks.badan, { color: t.tintaSedang }]}>password123</Text>
              </View>
              <Garis />
            </View>
          </Tekan>

          <Text style={[teks.kolom, { color: t.tintaPudar, textAlign: 'center', marginTop: jarak.lg, opacity: 0.7 }]}>
            {API.replace(/^https?:\/\//, '')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Kertas>
  );
}
