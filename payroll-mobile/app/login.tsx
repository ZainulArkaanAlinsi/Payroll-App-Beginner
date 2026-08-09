import { useState } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSesi } from '../src/auth';
import { ApiError, API } from '../src/api';
import { Kartu, Label, Tekan, Tombol, useTema } from '../src/ui';
import { HURUF, jarak, lengkung, teks, SENTUH } from '../src/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function Masuk() {
  const t = useTema();
  const router = useRouter();
  const { masuk } = useSesi();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihat, setLihat] = useState(false);
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

  const isian = {
    flex: 1,
    minHeight: SENTUH,
    color: t.tinta,
    fontSize: 15.5,
    paddingVertical: jarak.sm,
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.latar }}>
      {/* panel gelap menutupi puncak layar, sama seperti di dalam aplikasi */}
      <LinearGradient
        colors={t.panel}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 300,
          borderBottomLeftRadius: lengkung.xxl,
          borderBottomRightRadius: lengkung.xxl,
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: jarak.lg,
            paddingTop: insets.top + jarak.xxl,
            paddingBottom: insets.bottom + jarak.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: jarak.xl }}>
            <View
              style={{
                width: 56, height: 56, borderRadius: lengkung.md,
                backgroundColor: 'rgba(255,255,255,0.16)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26, fontFamily: HURUF.beratII, color: '#ffffff' }}>R</Text>
            </View>
            <Text style={[teks.judul, { color: '#ffffff', marginTop: jarak.md }]}>Racik</Text>
            <Text style={[teks.kecil, { color: t.panelRedup, marginTop: 3 }]}>
              Absen, slip gaji, cuti, dan lembur
            </Text>
          </View>

          <Kartu putih style={{ padding: jarak.lg, gap: jarak.lg }}>
            <View style={{ gap: 6 }}>
              <Label>Surel</Label>
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: jarak.sm,
                  backgroundColor: t.lembut, borderRadius: lengkung.md,
                  paddingHorizontal: jarak.md,
                }}
              >
                <Ionicons name="mail-outline" size={17} color={t.tintaRedup} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nama@perusahaan.id"
                  placeholderTextColor={t.tintaRedup}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  style={isian}
                />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Label>Kata sandi</Label>
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: jarak.sm,
                  backgroundColor: t.lembut, borderRadius: lengkung.md,
                  paddingHorizontal: jarak.md,
                }}
              >
                <Ionicons name="lock-closed-outline" size={17} color={t.tintaRedup} />
                <TextInput
                  value={sandi}
                  onChangeText={setSandi}
                  placeholder="••••••••"
                  placeholderTextColor={t.tintaRedup}
                  secureTextEntry={!lihat}
                  textContentType="password"
                  onSubmitEditing={kirim}
                  returnKeyType="go"
                  style={isian}
                />
                <Tekan onPress={() => setLihat((v) => !v)} hitSlop={12} getarkan={false}>
                  <Ionicons name={lihat ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.tintaRedup} />
                </Tekan>
              </View>
            </View>

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

            <Tombol judul="Masuk" onPress={kirim} memuat={sibuk} />
          </Kartu>

          {/* Akun contoh — proyek ini dipakai sebagai portofolio, jadi siapa pun
              yang membukanya harus bisa langsung masuk tanpa bertanya. */}
          <Tekan
            onPress={() => {
              setEmail('adit.prakoso@nusantaradigital.id');
              setSandi('password123');
            }}
            style={{ marginTop: jarak.lg }}
          >
            <Kartu rapat>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: jarak.md }}>
                <Ionicons name="person-circle-outline" size={22} color={t.merek} />
                <View style={{ flex: 1 }}>
                  <Text style={[teks.kecil, { color: t.tinta, fontFamily: HURUF.beratI }]}>
                    Akun contoh
                  </Text>
                  <Text style={[teks.kecil, { color: t.tintaRedup, marginTop: 1 }]} numberOfLines={1}>
                    adit.prakoso@nusantaradigital.id · password123
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={t.tintaRedup} />
              </View>
            </Kartu>
          </Tekan>

          <Text style={[teks.kecil, { color: t.tintaRedup, textAlign: 'center', marginTop: jarak.lg, fontSize: 11 }]}>
            {API.replace(/^https?:\/\//, '')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
