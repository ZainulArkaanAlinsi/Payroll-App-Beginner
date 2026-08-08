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
        <StatusBar style={malam ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: t.bg },
            headerTintColor: t.kuat,
            headerTitleStyle: { fontSize: 17, fontWeight: '600' },
            headerShadowVisible: false,
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
