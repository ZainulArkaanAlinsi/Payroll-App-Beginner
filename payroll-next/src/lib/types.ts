/** Bentuk balikan seragam untuk semua server action berbasis formulir. */
export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  /** kesalahan per-field, dipakai untuk menandai input yang salah */
  fields?: Record<string, string>;
}

export const OK = (message: string): ActionState => ({ ok: true, message });
export const FAIL = (error: string, fields?: Record<string, string>): ActionState => ({
  ok: false,
  error,
  fields,
});
