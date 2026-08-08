/**
 * Umpan balik getar.
 *
 * Absen adalah tindakan yang menghasilkan catatan resmi, dan di layar ponsel
 * satu-satunya tanda bahwa ketukan benar-benar diterima adalah tampilan yang
 * berubah — yang datang belakangan setelah jaringan menjawab. Getaran singkat
 * mengisi jeda itu, dan bedanya terasa saat dipakai sambil berjalan.
 *
 * Dibungkus supaya kegagalannya tidak pernah membatalkan tindakan utamanya:
 * ada perangkat tanpa motor getar, dan Expo Web tidak mendukungnya sama sekali.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const bisa = Platform.OS === 'ios' || Platform.OS === 'android';

export const getar = {
  ketuk() {
    if (bisa) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  berhasil() {
    if (bisa) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  gagal() {
    if (bisa) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
