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
            headerTransparent: true,
            headerTintColor: t.tinta,
            headerTitleStyle: { fontSize: 16, fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: t.kertas },
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
