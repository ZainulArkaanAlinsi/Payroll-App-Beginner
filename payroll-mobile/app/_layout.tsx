import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { PenyediaSesi } from '../src/auth';
import { gelap, terang } from '../src/theme';

/*
 * Layar pembuka ditahan sampai hurufnya benar-benar termuat.
 *
 * Tanpa ini, layar pertama sempat tampil dengan huruf bawaan sistem lalu
 * melompat begitu huruf aslinya siap — dan lompatan itu terlihat seperti
 * aplikasi yang belum selesai dimuat, tepat pada kesan pertama.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function TataLetakAkar() {
  const malam = useColorScheme() === 'dark';
  const t = malam ? gelap : terang;

  const [siap, gagal] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // Huruf yang gagal dimuat tidak boleh menahan aplikasi selamanya: lebih
    // baik tampil dengan huruf bawaan daripada berhenti di layar pembuka.
    if (siap || gagal) SplashScreen.hideAsync().catch(() => {});
  }, [siap, gagal]);

  if (!siap && !gagal) return null;

  return (
    <SafeAreaProvider>
      <PenyediaSesi>
        {/*
          Bilah status selalu terang: puncak layar ditempati panel gelap pada
          hampir semua layar, jadi ikon gelap akan hilang di atasnya.
        */}
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: t.latar },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="slip/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </PenyediaSesi>
    </SafeAreaProvider>
  );
}
