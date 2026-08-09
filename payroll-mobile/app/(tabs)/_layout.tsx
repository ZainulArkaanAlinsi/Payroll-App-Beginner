import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSesi } from '../../src/auth';
import { TINGGI_TAB, useTema } from '../../src/ui';

const TAB = [
  { nama: 'index', judul: 'Beranda', ikon: 'ellipse-outline', aktif: 'ellipse' },
  { nama: 'kehadiran', judul: 'Kehadiran', ikon: 'calendar-clear-outline', aktif: 'calendar-clear' },
  { nama: 'slip', judul: 'Slip', ikon: 'document-text-outline', aktif: 'document-text' },
  { nama: 'pengajuan', judul: 'Pengajuan', ikon: 'create-outline', aktif: 'create' },
  { nama: 'profil', judul: 'Profil', ikon: 'person-outline', aktif: 'person' },
] as const;

export default function TataLetakTab() {
  const t = useTema();
  const { pengguna, memuat } = useSesi();
  const insets = useSafeAreaInsets();

  if (memuat) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.kertas }}>
        <ActivityIndicator color={t.tintaPudar} />
      </View>
    );
  }
  // Penjagaan di sisi klien ini hanya soal kenyamanan; setiap rute API tetap
  // memeriksa tokennya sendiri di server.
  if (!pengguna) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        /*
         * Header dan bilah tab memakai warna kertas yang sama dengan isinya,
         * dipisahkan garis rambut saja. Blur dan bayangan di sini hanya akan
         * menciptakan lapisan yang tidak berarti apa-apa — dokumen tidak
         * mengambang di atas dokumen.
         */
        headerStyle: { backgroundColor: t.kertas, borderBottomWidth: 0 },
        headerTintColor: t.tinta,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        headerShadowVisible: false,
        headerTransparent: true,
        sceneStyle: { backgroundColor: t.kertas },

        tabBarStyle: {
          backgroundColor: t.kertas,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.garis,
          height: TINGGI_TAB + insets.bottom,
          paddingTop: 10,
          paddingBottom: (insets.bottom || 0) + 14,
          elevation: 0,
        },
        tabBarActiveTintColor: t.tinta,
        tabBarInactiveTintColor: t.tintaPudar,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 3 },
      }}
    >
      {TAB.map((tab) => (
        <Tabs.Screen
          key={tab.nama}
          name={tab.nama}
          options={{
            title: tab.judul,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={(focused ? tab.aktif : tab.ikon) as never} size={19} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
