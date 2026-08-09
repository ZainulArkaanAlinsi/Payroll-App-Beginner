import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PenyediaSesi } from '../src/auth';
import { gelap, terang } from '../src/theme';

export default function TataLetakAkar() {
  const malam = useColorScheme() === 'dark';
  const t = malam ? gelap : terang;

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
