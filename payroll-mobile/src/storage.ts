/**
 * Penyimpanan token.
 *
 * Di perangkat, token disimpan di Keychain (iOS) / Keystore (Android) lewat
 * expo-secure-store — bukan AsyncStorage, karena token itu berumur 30 hari dan
 * setara kunci masuk. Di Expo Web modul itu tidak tersedia, jadi di sana
 * dipakai localStorage; hanya untuk pengembangan, tidak untuk pemakaian nyata.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KUNCI = 'racik_token';

export async function simpanToken(token: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(KUNCI, token);
    return;
  }
  await SecureStore.setItemAsync(KUNCI, token);
}

export async function bacaToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(KUNCI) ?? null;
  }
  return SecureStore.getItemAsync(KUNCI);
}

export async function hapusToken() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(KUNCI);
    return;
  }
  await SecureStore.deleteItemAsync(KUNCI);
}
