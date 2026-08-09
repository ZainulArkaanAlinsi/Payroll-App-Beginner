import { Redirect, Tabs } from 'expo-router';
import { View, Text, ActivityIndicator, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSesi } from '../../src/auth';
import { TINGGI_TAB, Tekan, useTema } from '../../src/ui';
import { useReduceMotion } from '../../src/gerak';
import { bayangan, jarak, lengkung, teks } from '../../src/theme';

const TAB = [
  { nama: 'index', judul: 'Beranda', ikon: 'home-outline', aktif: 'home' },
  { nama: 'kehadiran', judul: 'Kehadiran', ikon: 'calendar-outline', aktif: 'calendar' },
  { nama: 'slip', judul: 'Slip', ikon: 'receipt-outline', aktif: 'receipt' },
  { nama: 'pengajuan', judul: 'Pengajuan', ikon: 'paper-plane-outline', aktif: 'paper-plane' },
  { nama: 'profil', judul: 'Profil', ikon: 'person-outline', aktif: 'person' },
] as const;

export default function TataLetakTab() {
  const t = useTema();
  const { pengguna, memuat } = useSesi();

  if (memuat) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.latar }}>
        <ActivityIndicator color={t.merek} />
      </View>
    );
  }
  // Penjagaan di sisi klien ini hanya soal kenyamanan; setiap rute API tetap
  // memeriksa tokennya sendiri di server.
  if (!pengguna) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.latar } }}
      tabBar={(props) => <BilahTab {...props} />}
    >
      {TAB.map((tab) => (
        <Tabs.Screen key={tab.nama} name={tab.nama} options={{ title: tab.judul }} />
      ))}
    </Tabs>
  );
}

/**
 * Bilah tab berbentuk pil yang mengambang di atas isi.
 *
 * Tidak menempel di tepi layar dan tidak selebar layar. Bentuk ini membuat isi
 * di bawahnya terasa berlanjut ke belakang bilah alih-alih terpotong, dan
 * memberi jempol sasaran yang lebih dekat ke tengah — pada layar besar, sudut
 * bawah adalah tempat yang paling sulit dijangkau.
 */
function BilahTab({ state, navigation }: any) {
  const t = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: jarak.lg,
        right: jarak.lg,
        bottom: (insets.bottom || jarak.md) + jarak.xs,
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            height: TINGGI_TAB,
            borderRadius: lengkung.pil,
            backgroundColor: t.gelap ? '#1b2340' : '#131a33',
            paddingHorizontal: 6,
            alignItems: 'center',
          },
          bayangan(t, 'apung'),
        ]}
      >
        {state.routes.map((route: any, i: number) => {
          const tab = TAB.find((x) => x.nama === route.name);
          if (!tab) return null;
          const fokus = state.index === i;

          return (
            <Butir
              key={route.key}
              fokus={fokus}
              ikon={(fokus ? tab.aktif : tab.ikon) as never}
              judul={tab.judul}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!fokus && !e.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

/**
 * Satu butir tab.
 *
 * Yang sedang aktif melebar dan menampilkan namanya; sisanya hanya ikon. Itu
 * memberi ruang bagi label yang sedang berlaku tanpa menyempitkan kelima
 * sasaran sentuh sekaligus.
 */
function Butir({
  fokus, ikon, judul, onPress,
}: { fokus: boolean; ikon: never; judul: string; onPress: () => void }) {
  const t = useTema();
  const kurangiGerak = useReduceMotion();
  const maju = useRef(new Animated.Value(fokus ? 1 : 0)).current;

  useEffect(() => {
    if (kurangiGerak) { maju.setValue(fokus ? 1 : 0); return; }
    Animated.timing(maju, {
      toValue: fokus ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      // warna latar tidak bisa dianimasikan oleh penggerak asli
      useNativeDriver: false,
    }).start();
  }, [fokus, maju, kurangiGerak]);

  return (
    <Tekan
      onPress={onPress}
      style={{ flex: fokus ? 1.9 : 1 }}
      accessibilityRole="button"
      accessibilityLabel={judul}
      accessibilityState={{ selected: fokus }}
    >
      <Animated.View
        style={{
          height: TINGGI_TAB - 14,
          borderRadius: lengkung.pil,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: maju.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255,255,255,0)', t.merek],
          }),
        }}
      >
        <Ionicons name={ikon} size={19} color={fokus ? '#ffffff' : 'rgba(255,255,255,0.55)'} />
        {fokus ? (
          <Text style={[teks.mikro, { color: '#ffffff', fontSize: 11.5 }]} numberOfLines={1}>
            {judul}
          </Text>
        ) : null}
      </Animated.View>
    </Tekan>
  );
}
