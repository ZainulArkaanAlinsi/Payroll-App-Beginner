import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSesi } from '../src/auth';
import { useTema } from '../src/ui';

/** Menahan tampilan sampai token tersimpan selesai diperiksa ke server. */
export default function Gerbang() {
  const { pengguna, memuat } = useSesi();
  const t = useTema();

  if (memuat) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.latar }}>
        <ActivityIndicator color={t.merek} />
      </View>
    );
  }
  return <Redirect href={pengguna ? '/(tabs)' : '/login'} />;
}
