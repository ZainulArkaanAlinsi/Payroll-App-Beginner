import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSesi } from '../../src/auth';
import { useTema } from '../../src/ui';

export default function TataLetakTab() {
  const t = useTema();
  const { pengguna, memuat } = useSesi();
  const insets = useSafeAreaInsets();

  if (memuat) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.aksen} />
      </View>
    );
  }
  // Penjagaan di sisi klien ini hanya soal kenyamanan; setiap rute API tetap
  // memeriksa tokennya sendiri di server.
  if (!pengguna) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.kuat,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        sceneStyle: { backgroundColor: t.bg },
        // Di Android, isi layar menggambar sampai ke bawah bilah navigasi
        // sistem — edge-to-edge adalah perilaku bawaan sejak React Native 0.81.
        // Tanpa menambahkan inset ini, label tab tertutup tombol navigasi.
        tabBarStyle: {
          backgroundColor: t.kartu,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.kartuTepi,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: t.aksen,
        tabBarInactiveTintColor: t.redup,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kehadiran"
        options={{
          title: 'Kehadiran',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="slip"
        options={{
          title: 'Slip gaji',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pengajuan"
        options={{
          title: 'Pengajuan',
          tabBarIcon: ({ color, size }) => <Ionicons name="paper-plane-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
