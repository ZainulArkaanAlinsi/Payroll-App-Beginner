import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { PenyediaSesi } from '../src/auth';
import { gelap, terang } from '../src/theme';

export default function TataLetakAkar() {
  const malam = useColorScheme() === 'dark';
  const t = malam ? gelap : terang;

  return (
    <SafeAreaProvider>
      <PenyediaSesi>
        <StatusBar style={malam ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerTransparent: true,
            headerTintColor: t.kuat,
            headerTitleStyle: { fontSize: 17, fontWeight: '700' },
            headerShadowVisible: false,
            // Header tembus pandang dengan blur, sama seperti di dalam tab —
            // isi terlihat bergulir di belakangnya alih-alih terpotong garis.
            headerBackground: () => (
              <BlurView
                intensity={40}
                tint={malam ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ),
            contentStyle: { backgroundColor: t.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="slip/[id]" options={{ title: 'Slip gaji', presentation: 'card' }} />
        </Stack>
      </PenyediaSesi>
    </SafeAreaProvider>
  );
}
