import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSesi } from '../../src/auth';
import { LatarHalaman, TINGGI_TAB, useTema } from '../../src/ui';

const TAB = [
  { nama: 'index', judul: 'Beranda', ikon: 'home', ikonAktif: 'home' },
  { nama: 'kehadiran', judul: 'Kehadiran', ikon: 'calendar-outline', ikonAktif: 'calendar' },
  { nama: 'slip', judul: 'Slip gaji', ikon: 'receipt-outline', ikonAktif: 'receipt' },
  { nama: 'pengajuan', judul: 'Pengajuan', ikon: 'paper-plane-outline', ikonAktif: 'paper-plane' },
  { nama: 'profil', judul: 'Profil', ikon: 'person-outline', ikonAktif: 'person' },
] as const;

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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LatarHalaman />

      <Tabs
        screenOptions={{
          headerTransparent: true,
          headerTintColor: t.kuat,
          headerTitleStyle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
          headerShadowVisible: false,
          headerBackground: () => (
            <BlurView
              intensity={40}
              tint={t.gelap ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ),
          sceneStyle: { backgroundColor: 'transparent' },

          /*
           * Bilah tab mengambang di atas isi, bukan menempel di tepi layar.
           * Blur di belakangnya membuat isi yang bergulir tetap terlihat
           * sebagai bentuk tanpa bersaing dengan labelnya — pola yang sama
           * dipakai iOS pada bilah bawahnya.
           */
          tabBarBackground: () => (
            <BlurView
              intensity={64}
              tint={t.gelap ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: t.kaca,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: t.kacaTepi,
                },
              ]}
            />
          ),
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            // Android menggambar sampai ke bawah bilah navigasi sistem sejak
            // React Native 0.81, jadi insetnya ditambahkan sendiri.
            height: TINGGI_TAB + insets.bottom,
            paddingTop: 8,
            // Label duduk tepat di tepi bawah bila ruangnya pas-pasan, dan
            // terpotong pada perangkat tanpa area aman bawah.
            paddingBottom: (insets.bottom || 0) + 12,
            elevation: 0,
          },
          tabBarActiveTintColor: t.aksen,
          tabBarInactiveTintColor: t.redup,
          tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.1, marginTop: 1 },
        }}
      >
        {TAB.map((tab) => (
          <Tabs.Screen
            key={tab.nama}
            name={tab.nama}
            options={{
              title: tab.judul,
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={(focused ? tab.ikonAktif : tab.ikon) as never}
                  size={size - 2}
                  color={color}
                />
              ),
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}
