import { useState } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSesi } from '../src/auth';
import { ApiError, API } from '../src/api';
import { Tombol, useTema } from '../src/ui';
import { jarak, lengkung, teks } from '../src/theme';

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

  const gayaIsian = {
    minHeight: 50,
    borderWidth: 1,
    borderColor: t.isianTepi,
    backgroundColor: t.isian,
    borderRadius: lengkung.md,
    paddingHorizontal: jarak.md,
    color: t.kuat,
    fontSize: 15.5,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: jarak.xl,
          paddingTop: insets.top + jarak.xxl,
          paddingBottom: insets.bottom + jarak.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* jenama */}
        <View style={{ marginBottom: jarak.xxl }}>
          <View
            style={{
              width: 46, height: 46, borderRadius: 13, backgroundColor: t.aksen,
              alignItems: 'center', justifyContent: 'center', marginBottom: jarak.lg,
            }}
          >
            <Text style={{ color: t.aksenTeks, fontSize: 22, fontWeight: '700' }}>R</Text>
          </View>
          <Text style={[teks.judul, { color: t.kuat }]}>Racik</Text>
          <Text style={[teks.badan, { color: t.redup, marginTop: 6 }]}>
            Portal karyawan — absen, slip gaji, cuti, dan lembur.
          </Text>
        </View>

        <View style={{ gap: jarak.md }}>
          <View style={{ gap: 6 }}>
            <Text style={[teks.label, { color: t.badan }]}>Surel</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="nama@perusahaan.id"
              placeholderTextColor={t.redup}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              style={gayaIsian}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[teks.label, { color: t.badan }]}>Kata sandi</Text>
            <TextInput
              value={sandi}
              onChangeText={setSandi}
              placeholder="••••••••"
              placeholderTextColor={t.redup}
              secureTextEntry
              textContentType="password"
              onSubmitEditing={kirim}
              returnKeyType="go"
              style={gayaIsian}
            />
          </View>

          {galat ? (
            <View style={{ padding: jarak.md, borderRadius: lengkung.md, backgroundColor: t.bahayaLembut }}>
              <Text style={[teks.badan, { color: t.bahaya }]}>{galat}</Text>
            </View>
          ) : null}

          <Tombol judul="Masuk" onPress={kirim} memuat={sibuk} style={{ marginTop: jarak.sm }} />
        </View>

        {/* Akun contoh — proyek ini dipakai sebagai portofolio, jadi siapa pun
            yang membukanya harus bisa langsung masuk tanpa bertanya. */}
        <Pressable
          onPress={() => {
            setEmail('adit.prakoso@nusantaradigital.id');
            setSandi('password123');
          }}
          style={{
            marginTop: jarak.xxl, padding: jarak.md, borderRadius: lengkung.md,
            borderWidth: StyleSheet.hairlineWidth, borderColor: t.kartuTepi, backgroundColor: t.kartu,
          }}
        >
          <Text style={[teks.mikro, { color: t.redup, textTransform: 'uppercase', marginBottom: 4 }]}>
            Akun contoh — ketuk untuk mengisi
          </Text>
          <Text style={[teks.label, { color: t.badan }]}>adit.prakoso@nusantaradigital.id</Text>
          <Text style={[teks.label, { color: t.badan }]}>password123</Text>
        </Pressable>

        <Text style={[teks.mikro, { color: t.redup, textAlign: 'center', marginTop: jarak.lg }]}>
          Server: {API}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
