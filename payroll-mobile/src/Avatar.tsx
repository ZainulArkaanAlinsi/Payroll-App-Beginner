import { View, Text, Image, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { inisial, warnaAvatar } from './lib/avatar';
import { HURUF } from './theme';

/**
 * Avatar karyawan.
 *
 * Kembaran komponen yang sama di aplikasi web, dan warnanya dihitung oleh
 * berkas `avatar.ts` yang isinya persis sama di kedua sisi. Karyawan yang
 * melihat dirinya berwarna nila di ponsel akan terlihat nila juga di layar
 * HRD — hal kecil, tetapi itulah yang membuat dua aplikasi terasa satu produk
 * alih-alih dua barang berbeda.
 */
export function Avatar({
  nama,
  foto,
  ukuran = 44,
  cincin,
  style,
}: {
  nama: string;
  foto?: string | null;
  /** Cincin putih tipis, untuk avatar yang berdiri di atas panel berwarna. */
  cincin?: boolean;
  ukuran?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const w = warnaAvatar(nama);

  const bingkai: StyleProp<ViewStyle> = [
    {
      width: ukuran,
      height: ukuran,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    cincin ? { borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)' } : null,
    style,
  ];

  if (foto) {
    // React Native memisahkan tipe gaya View dan Image meskipun ukuran,
    // lengkung, dan bingkai berlaku pada keduanya; alihannya di sini aman.
    return (
      <Image
        source={{ uri: foto }}
        style={bingkai as StyleProp<ImageStyle>}
        accessibilityLabel={nama}
      />
    );
  }

  return (
    <View style={bingkai} accessible accessibilityLabel={nama}>
      <LinearGradient
        colors={[w.dari, w.ke]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontFamily: HURUF.beratI,
            fontSize: ukuran * 0.38,
            letterSpacing: -0.5,
          }}
        >
          {inisial(nama)}
        </Text>
      </LinearGradient>
    </View>
  );
}
