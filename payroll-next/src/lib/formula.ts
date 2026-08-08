/**
 * Mesin rumus Racik — inti dari "HR bisa meracik sendiri".
 *
 * HR menulis rumus seperti di Excel:
 *   MIN(GAJI_POKOK * 0.05; 500000)
 *   IF(MASA_KERJA_BULAN >= 12; 1000000; 500000)
 *   JAM_LEMBUR * (GAJI_POKOK / 173) * 1.5
 *
 * Dievaluasi dengan tokenizer + shunting-yard + interpreter, BUKAN eval().
 * eval() akan menjalankan JavaScript apa pun yang diketik ke basis data —
 * artinya siapa pun yang bisa mengubah komponen gaji bisa menjalankan kode
 * di server. Parser sendiri hanya mengenal angka, variabel terdaftar, dan
 * fungsi yang diizinkan; selain itu ditolak.
 */

export type Variables = Record<string, number>;

/** Variabel yang tersedia di dalam rumus, beserta penjelasannya untuk HR. */
export const VARIABEL: { key: string; label: string; contoh: string }[] = [
  { key: 'GAJI_POKOK', label: 'Gaji pokok bulanan karyawan', contoh: '8.000.000' },
  { key: 'TUNJANGAN_TETAP', label: 'Total tunjangan tetap yang sudah melekat', contoh: '2.000.000' },
  { key: 'UPAH_SEJAM', label: 'Upah per jam (1/173 upah sebulan)', contoh: '57.803' },
  { key: 'HARI_KERJA', label: 'Jumlah hari kerja dalam periode', contoh: '22' },
  { key: 'HARI_HADIR', label: 'Hari karyawan benar-benar masuk', contoh: '20' },
  { key: 'HARI_MANGKIR', label: 'Hari tanpa keterangan', contoh: '1' },
  { key: 'HARI_CUTI', label: 'Hari cuti yang disetujui', contoh: '1' },
  { key: 'JAM_LEMBUR', label: 'Jam lembur hari kerja yang disetujui', contoh: '6' },
  { key: 'JAM_LEMBUR_LIBUR', label: 'Jam lembur hari libur yang disetujui', contoh: '4' },
  { key: 'MENIT_TELAT', label: 'Akumulasi menit keterlambatan', contoh: '45' },
  { key: 'MASA_KERJA_BULAN', label: 'Lama bekerja dihitung dalam bulan', contoh: '30' },
  { key: 'JUMLAH_TANGGUNGAN', label: 'Jumlah tanggungan dari status PTKP', contoh: '2' },
  { key: 'HARI_DIBAYAR', label: 'Hari yang dibayar (untuk prorata masuk tengah bulan)', contoh: '15' },
];

export const FUNGSI: { key: string; sig: string; label: string }[] = [
  { key: 'MIN', sig: 'MIN(a; b)', label: 'Ambil nilai terkecil — untuk memasang plafon' },
  { key: 'MAX', sig: 'MAX(a; b)', label: 'Ambil nilai terbesar — untuk memasang nilai minimum' },
  { key: 'ROUND', sig: 'ROUND(a)', label: 'Bulatkan ke rupiah terdekat' },
  { key: 'FLOOR', sig: 'FLOOR(a)', label: 'Bulatkan ke bawah' },
  { key: 'CEIL', sig: 'CEIL(a)', label: 'Bulatkan ke atas' },
  { key: 'ABS', sig: 'ABS(a)', label: 'Nilai mutlak' },
  { key: 'IF', sig: 'IF(syarat; nilai_benar; nilai_salah)', label: 'Percabangan bersyarat' },
];

// ───────────────────────────── Tokenizer ─────────────────────────────

type TokKind = 'num' | 'var' | 'fn' | 'op' | 'lparen' | 'rparen' | 'sep';
interface Tok {
  kind: TokKind;
  value: string;
  pos: number;
}

export class FormulaError extends Error {
  constructor(
    message: string,
    readonly pos?: number,
  ) {
    super(message);
    this.name = 'FormulaError';
  }
}

const FN_NAMES = new Set(FUNGSI.map((f) => f.key));

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }

    // Angka. Titik dan koma hanya ikut terbaca sebagai bagian angka bila
    // langsung diikuti digit — "1,5" desimal, tetapi "1, 5" bukan. Tanpa
    // syarat itu, koma pemisah argumen ikut termakan dan MIN(1000, 500)
    // terbaca sebagai satu argumen saja.
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length) {
        const ch = src[j];
        if (/[0-9]/.test(ch)) {
          j++;
          continue;
        }
        if ((ch === ',' || ch === '.') && /[0-9]/.test(src[j + 1] ?? '')) {
          j++;
          continue;
        }
        break;
      }
      const raw = src.slice(i, j);
      // pemisah ribuan dibuang, koma desimal jadi titik
      const cleaned = raw.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
      const n = Number(cleaned);
      if (Number.isNaN(n)) throw new FormulaError(`Angka tidak valid: "${raw}"`, i);
      toks.push({ kind: 'num', value: String(n), pos: i });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j).toUpperCase();
      // sebuah nama adalah fungsi hanya bila langsung diikuti kurung buka
      let k = j;
      while (k < src.length && src[k] === ' ') k++;
      toks.push({
        kind: src[k] === '(' && FN_NAMES.has(word) ? 'fn' : 'var',
        value: word,
        pos: i,
      });
      i = j;
      continue;
    }

    if (c === '(') {
      toks.push({ kind: 'lparen', value: c, pos: i });
      i++;
      continue;
    }
    if (c === ')') {
      toks.push({ kind: 'rparen', value: c, pos: i });
      i++;
      continue;
    }
    if (c === ';') {
      toks.push({ kind: 'sep', value: ';', pos: i });
      i++;
      continue;
    }

    // Koma yang sampai di sini bukan tanda desimal. Sengaja ditolak, bukan
    // ditebak: MIN(1,5; 2) bisa berarti MIN(1,5 dan 2) atau MIN(1 dan 5 dan 2),
    // dan menebak salah satunya pada rumus yang menghitung gaji orang jauh
    // lebih berbahaya daripada memaksa penulisnya memperjelas.
    if (c === ',') {
      throw new FormulaError(
        'Pakai titik koma (;) untuk memisahkan argumen. Koma hanya untuk desimal, misalnya 0,05.',
        i,
      );
    }

    // operator dua karakter lebih dulu
    const two = src.slice(i, i + 2);
    if (['>=', '<=', '==', '!=', '<>'].includes(two)) {
      toks.push({ kind: 'op', value: two === '<>' ? '!=' : two, pos: i });
      i += 2;
      continue;
    }
    if ('+-*/%^><='.includes(c)) {
      toks.push({ kind: 'op', value: c === '=' ? '==' : c, pos: i });
      i++;
      continue;
    }

    throw new FormulaError(`Karakter tidak dikenal: "${c}"`, i);
  }

  return toks;
}

// ─────────────────────── Shunting-yard → RPN ───────────────────────

const PREC: Record<string, number> = {
  '==': 1, '!=': 1, '>': 1, '<': 1, '>=': 1, '<=': 1,
  '+': 2, '-': 2,
  '*': 3, '/': 3, '%': 3,
  '^': 4,
  'u-': 5, // negatif unary
};

function toRpn(toks: Tok[]): Tok[] {
  const out: Tok[] = [];
  const stack: Tok[] = [];
  // menghitung argumen tiap pemanggilan fungsi
  const argc: number[] = [];

  let prev: Tok | null = null;

  for (const t of toks) {
    switch (t.kind) {
      case 'num':
      case 'var':
        out.push(t);
        break;

      case 'fn':
        stack.push(t);
        argc.push(1);
        break;

      case 'sep': {
        while (stack.length && stack[stack.length - 1].kind !== 'lparen') {
          out.push(stack.pop()!);
        }
        if (!stack.length) throw new FormulaError('Tanda pemisah di luar kurung fungsi', t.pos);
        if (argc.length) argc[argc.length - 1]++;
        break;
      }

      case 'op': {
        // minus di awal ekspresi atau setelah operator/kurung = negatif unary
        const unary =
          t.value === '-' &&
          (prev === null || prev.kind === 'op' || prev.kind === 'lparen' || prev.kind === 'sep');
        const op: Tok = unary ? { ...t, value: 'u-' } : t;

        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.kind !== 'op') break;
          // ^ dan unary asosiatif kanan
          const kanan = op.value === '^' || op.value === 'u-';
          if (kanan ? PREC[top.value] > PREC[op.value] : PREC[top.value] >= PREC[op.value]) {
            out.push(stack.pop()!);
          } else break;
        }
        stack.push(op);
        break;
      }

      case 'lparen':
        stack.push(t);
        break;

      case 'rparen': {
        while (stack.length && stack[stack.length - 1].kind !== 'lparen') {
          out.push(stack.pop()!);
        }
        if (!stack.length) throw new FormulaError('Kurung tutup tidak punya pasangan', t.pos);
        stack.pop(); // buang lparen
        if (stack.length && stack[stack.length - 1].kind === 'fn') {
          const fn = stack.pop()!;
          const n = argc.pop() ?? 1;
          out.push({ ...fn, value: `${fn.value}:${n}` });
        }
        break;
      }
    }
    prev = t;
  }

  while (stack.length) {
    const t = stack.pop()!;
    if (t.kind === 'lparen') throw new FormulaError('Ada kurung buka yang tidak ditutup', t.pos);
    out.push(t);
  }

  return out;
}

// ───────────────────────────── Evaluator ─────────────────────────────

function applyFn(name: string, args: number[], pos: number): number {
  switch (name) {
    case 'MIN':
      if (args.length < 2) throw new FormulaError('MIN butuh minimal 2 argumen', pos);
      return Math.min(...args);
    case 'MAX':
      if (args.length < 2) throw new FormulaError('MAX butuh minimal 2 argumen', pos);
      return Math.max(...args);
    case 'ROUND':
      return Math.round(args[0]);
    case 'FLOOR':
      return Math.floor(args[0]);
    case 'CEIL':
      return Math.ceil(args[0]);
    case 'ABS':
      return Math.abs(args[0]);
    case 'IF':
      if (args.length !== 3) throw new FormulaError('IF butuh tepat 3 argumen', pos);
      return args[0] !== 0 ? args[1] : args[2];
    default:
      throw new FormulaError(`Fungsi tidak dikenal: ${name}`, pos);
  }
}

function applyOp(op: string, a: number, b: number, pos: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      // pembagian nol dijadikan 0, bukan Infinity — nilai gaji tak
      // terhingga jauh lebih berbahaya daripada nol
      return b === 0 ? 0 : a / b;
    case '%': return b === 0 ? 0 : a % b;
    case '^': return Math.pow(a, b);
    case '>': return a > b ? 1 : 0;
    case '<': return a < b ? 1 : 0;
    case '>=': return a >= b ? 1 : 0;
    case '<=': return a <= b ? 1 : 0;
    case '==': return a === b ? 1 : 0;
    case '!=': return a !== b ? 1 : 0;
    default:
      throw new FormulaError(`Operator tidak dikenal: ${op}`, pos);
  }
}

const KNOWN_VARS = new Set(VARIABEL.map((v) => v.key));

export interface HasilRumus {
  nilai: number;
  /** langkah perhitungan untuk ditampilkan sebagai penjelasan */
  jejak: string[];
}

/** Menjalankan rumus. Melempar FormulaError bila rumusnya tidak sah. */
export function evalFormula(src: string, vars: Variables): HasilRumus {
  if (!src.trim()) throw new FormulaError('Rumus masih kosong');

  const rpn = toRpn(tokenize(src));
  const stack: number[] = [];
  const jejak: string[] = [];

  for (const t of rpn) {
    if (t.kind === 'num') {
      stack.push(Number(t.value));
    } else if (t.kind === 'var') {
      if (!KNOWN_VARS.has(t.value)) {
        throw new FormulaError(`Variabel "${t.value}" tidak dikenal`, t.pos);
      }
      const v = vars[t.value] ?? 0;
      stack.push(v);
      jejak.push(`${t.value} = ${v.toLocaleString('id-ID')}`);
    } else if (t.kind === 'fn') {
      const [name, nRaw] = t.value.split(':');
      const n = Number(nRaw);
      if (stack.length < n) throw new FormulaError(`Argumen ${name} kurang`, t.pos);
      const args = stack.splice(stack.length - n, n);
      const hasil = applyFn(name, args, t.pos);
      jejak.push(`${name}(${args.map((a) => a.toLocaleString('id-ID')).join('; ')}) = ${hasil.toLocaleString('id-ID')}`);
      stack.push(hasil);
    } else if (t.kind === 'op') {
      if (t.value === 'u-') {
        if (!stack.length) throw new FormulaError('Tanda minus tanpa angka', t.pos);
        stack.push(-stack.pop()!);
        continue;
      }
      if (stack.length < 2) throw new FormulaError(`Operator "${t.value}" kekurangan angka`, t.pos);
      const b = stack.pop()!;
      const a = stack.pop()!;
      stack.push(applyOp(t.value, a, b, t.pos));
    }
  }

  if (stack.length !== 1) throw new FormulaError('Rumus tidak lengkap atau ada bagian berlebih');

  const nilai = stack[0];
  if (!Number.isFinite(nilai)) throw new FormulaError('Hasil rumus bukan angka yang sah');

  return { nilai: Math.round(nilai), jejak };
}

/**
 * Memeriksa rumus tanpa menjalankannya dengan data sungguhan.
 * Dipakai saat HR mengetik, supaya kesalahan ketahuan sebelum disimpan.
 */
export function validateFormula(src: string): { ok: true; contoh: number } | { ok: false; pesan: string; pos?: number } {
  // nilai contoh yang wajar, supaya HR langsung melihat perkiraan hasilnya
  const contohVars: Variables = {
    GAJI_POKOK: 8_000_000,
    TUNJANGAN_TETAP: 2_000_000,
    UPAH_SEJAM: Math.round(10_000_000 / 173),
    HARI_KERJA: 22,
    HARI_HADIR: 20,
    HARI_MANGKIR: 1,
    HARI_CUTI: 1,
    JAM_LEMBUR: 6,
    JAM_LEMBUR_LIBUR: 4,
    MENIT_TELAT: 45,
    MASA_KERJA_BULAN: 30,
    JUMLAH_TANGGUNGAN: 2,
    HARI_DIBAYAR: 22,
  };

  try {
    const { nilai } = evalFormula(src, contohVars);
    return { ok: true, contoh: nilai };
  } catch (e) {
    if (e instanceof FormulaError) return { ok: false, pesan: e.message, pos: e.pos };
    return { ok: false, pesan: 'Rumus tidak bisa dibaca' };
  }
}

/** Menyusun kumpulan variabel dari data payroll satu karyawan. */
export function buildVariables(input: {
  baseSalary: number;
  fixedAllowance: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  overtimeHolidayHours: number;
  lateMinutes: number;
  monthsOfService: number;
  dependents: number;
  paidDays: number;
}): Variables {
  return {
    GAJI_POKOK: input.baseSalary,
    TUNJANGAN_TETAP: input.fixedAllowance,
    UPAH_SEJAM: Math.round((input.baseSalary + input.fixedAllowance) / 173),
    HARI_KERJA: input.workingDays,
    HARI_HADIR: input.presentDays,
    HARI_MANGKIR: input.absentDays,
    HARI_CUTI: input.leaveDays,
    JAM_LEMBUR: input.overtimeHours,
    JAM_LEMBUR_LIBUR: input.overtimeHolidayHours,
    MENIT_TELAT: input.lateMinutes,
    MASA_KERJA_BULAN: input.monthsOfService,
    JUMLAH_TANGGUNGAN: input.dependents,
    HARI_DIBAYAR: input.paidDays,
  };
}
