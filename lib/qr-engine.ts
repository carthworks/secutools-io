// File: lib/qr-engine.ts
/**
 * Standalone Pure TypeScript QR Code Generator
 * Full ISO/IEC 18004 Implementation
 * Supports Versions 1 to 40, Error Correction Levels L, M, Q, H,
 * UTF-8 Byte encoding, optimal mask selection, and module classification.
 */

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export const EC_LEVELS: Record<ErrorCorrectionLevel, { ordinal: number; bits: number; formatBits: number }> = {
  L: { ordinal: 0, bits: 0b01, formatBits: 0b01 },
  M: { ordinal: 1, bits: 0b00, formatBits: 0b00 },
  Q: { ordinal: 2, bits: 0b11, formatBits: 0b11 },
  H: { ordinal: 3, bits: 0b10, formatBits: 0b10 },
};

// Module types for styling (Finder eyes vs Data dots vs Timing vs Alignment)
export enum ModuleType {
  DATA = 1,
  FINDER_OUTER = 2,
  FINDER_INNER = 3,
  FINDER_SPACE = 4,
  ALIGNMENT = 5,
  TIMING = 6,
  FORMAT = 7,
  VERSION = 8,
  DARK = 9,
}

export interface QRMatrix {
  version: number;
  size: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  maskPattern: number;
  modules: boolean[][];
  moduleTypes: ModuleType[][];
}

/* -------------------------------------------------------------------------- */
/* Galois Field GF(256) Math & Reed-Solomon Polynomials                      */
/* -------------------------------------------------------------------------- */

const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // x^8 + x^4 + x^3 + x^2 + 1
    }
  }
})();

function gMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const factor = new Uint8Array([1, EXP_TABLE[i]]);
    const nextPoly = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      for (let k = 0; k < factor.length; k++) {
        nextPoly[j + k] ^= gMul(poly[j], factor[k]);
      }
    }
    poly = nextPoly;
  }
  return poly;
}

function rsComputeEcc(data: Uint8Array, eccLength: number): Uint8Array {
  const gen = rsGeneratorPoly(eccLength);
  const remainder = new Uint8Array(eccLength);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[eccLength - 1] = 0;
    for (let j = 0; j < eccLength; j++) {
      remainder[j] ^= gMul(gen[j + 1], factor);
    }
  }
  return remainder;
}

/* -------------------------------------------------------------------------- */
/* QR Code Specification Tables                                               */
/* -------------------------------------------------------------------------- */

// [totalDataCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsGroup1, numBlocksGroup2, dataCodewordsGroup2]
type ECCBlockInfo = [number, number, number, number, number, number];

// Index: version (1..40), EC level: L, M, Q, H
const ECC_TABLE: Record<ErrorCorrectionLevel, ECCBlockInfo[]> = {
  L: [
    [0, 0, 0, 0, 0, 0], // 0 placeholder
    [19, 7, 1, 19, 0, 0],
    [34, 10, 1, 34, 0, 0],
    [55, 15, 1, 55, 0, 0],
    [80, 20, 1, 80, 0, 0],
    [108, 26, 1, 108, 0, 0],
    [136, 18, 2, 68, 0, 0],
    [156, 20, 2, 78, 0, 0],
    [194, 24, 2, 97, 0, 0],
    [232, 30, 2, 116, 0, 0],
    [274, 18, 2, 68, 2, 69],
    [324, 20, 4, 81, 0, 0],
    [370, 24, 2, 92, 2, 93],
    [428, 26, 4, 107, 0, 0],
    [461, 30, 3, 115, 1, 116],
    [523, 22, 5, 87, 1, 88],
    [589, 24, 5, 98, 1, 99],
    [647, 28, 1, 107, 5, 108],
    [721, 30, 5, 120, 1, 121],
    [795, 28, 3, 113, 4, 114],
    [861, 28, 3, 107, 5, 108],
    [932, 28, 4, 116, 4, 117],
    [1006, 28, 2, 111, 7, 112],
    [1094, 30, 4, 121, 5, 122],
    [1174, 30, 6, 117, 4, 118],
    [1276, 26, 8, 106, 4, 107],
    [1370, 28, 10, 114, 2, 115],
    [1468, 30, 8, 122, 4, 123],
    [1531, 30, 3, 117, 10, 118],
    [1631, 30, 7, 116, 7, 117],
    [1735, 30, 5, 115, 10, 116],
    [1843, 30, 13, 115, 3, 116],
    [1955, 30, 17, 115, 0, 0],
    [2071, 30, 17, 115, 1, 116],
    [2191, 30, 13, 115, 6, 116],
    [2306, 30, 12, 121, 7, 122],
    [2434, 30, 6, 121, 14, 122],
    [2566, 30, 17, 122, 4, 123],
    [2702, 30, 4, 122, 18, 123],
    [2812, 30, 20, 117, 4, 118],
    [2956, 30, 19, 118, 6, 119],
  ],
  M: [
    [0, 0, 0, 0, 0, 0],
    [16, 10, 1, 16, 0, 0],
    [28, 16, 1, 28, 0, 0],
    [44, 26, 1, 44, 0, 0],
    [64, 18, 2, 32, 0, 0],
    [86, 24, 2, 43, 0, 0],
    [108, 16, 4, 27, 0, 0],
    [124, 18, 4, 31, 0, 0],
    [154, 22, 2, 38, 2, 39],
    [182, 22, 3, 36, 2, 37],
    [216, 26, 4, 43, 1, 44],
    [254, 30, 2, 42, 4, 43],
    [290, 22, 6, 48, 2, 49],
    [334, 22, 8, 41, 1, 42],
    [365, 24, 4, 45, 5, 46],
    [415, 24, 5, 41, 5, 42],
    [461, 28, 7, 45, 3, 46],
    [509, 28, 10, 46, 1, 47],
    [569, 26, 9, 43, 4, 44],
    [627, 26, 3, 44, 11, 45],
    [683, 26, 3, 41, 13, 42],
    [742, 26, 17, 42, 0, 0],
    [799, 28, 17, 46, 0, 0],
    [871, 28, 4, 47, 14, 48],
    [932, 28, 6, 45, 14, 46],
    [1006, 28, 17, 47, 4, 48],
    [1094, 28, 4, 46, 18, 47],
    [1174, 28, 20, 46, 4, 47],
    [1234, 28, 19, 47, 6, 48],
    [1317, 28, 18, 47, 8, 48],
    [1405, 28, 25, 47, 3, 48],
    [1498, 28, 21, 48, 8, 49],
    [1596, 28, 19, 47, 14, 48],
    [1698, 28, 22, 47, 13, 48],
    [1805, 28, 22, 48, 14, 49],
    [1908, 28, 12, 47, 26, 48],
    [2026, 28, 23, 47, 17, 48],
    [2148, 28, 23, 47, 19, 48],
    [2280, 28, 19, 47, 26, 48],
    [2370, 28, 11, 47, 34, 48],
    [2492, 28, 27, 47, 19, 48],
  ],
  Q: [
    [0, 0, 0, 0, 0, 0],
    [13, 13, 1, 13, 0, 0],
    [22, 22, 1, 22, 0, 0],
    [34, 18, 2, 17, 0, 0],
    [48, 26, 2, 24, 0, 0],
    [62, 18, 4, 15, 0, 0],
    [76, 24, 4, 19, 0, 0],
    [88, 18, 2, 14, 4, 15],
    [110, 22, 4, 18, 2, 19],
    [132, 20, 4, 16, 4, 17],
    [154, 24, 6, 19, 2, 20],
    [180, 28, 4, 22, 4, 23],
    [206, 26, 4, 20, 6, 21],
    [244, 24, 8, 20, 4, 21],
    [261, 20, 11, 16, 5, 17],
    [295, 30, 5, 24, 7, 25],
    [325, 24, 15, 19, 2, 20],
    [367, 28, 3, 28, 11, 29],
    [397, 28, 17, 21, 1, 22],
    [445, 26, 17, 21, 4, 22],
    [485, 30, 15, 24, 5, 25],
    [512, 28, 17, 22, 6, 23],
    [568, 30, 7, 24, 16, 25],
    [614, 30, 11, 24, 14, 25],
    [664, 30, 11, 24, 16, 25],
    [718, 30, 7, 24, 22, 25],
    [754, 30, 28, 24, 2, 25],
    [808, 30, 8, 24, 26, 25],
    [871, 30, 4, 24, 31, 25],
    [911, 30, 1, 24, 37, 25],
    [985, 30, 15, 24, 25, 25],
    [1033, 30, 42, 24, 1, 25],
    [1115, 30, 10, 24, 35, 25],
    [1171, 30, 29, 24, 19, 25],
    [1231, 30, 44, 24, 7, 25],
    [1286, 30, 39, 24, 14, 25],
    [1354, 30, 46, 24, 10, 25],
    [1426, 30, 49, 24, 10, 25],
    [1502, 30, 48, 24, 14, 25],
    [1582, 30, 43, 24, 22, 25],
    [1666, 30, 34, 24, 34, 25],
  ],
  H: [
    [0, 0, 0, 0, 0, 0],
    [9, 17, 1, 9, 0, 0],
    [16, 28, 1, 16, 0, 0],
    [26, 22, 2, 13, 0, 0],
    [36, 16, 4, 9, 0, 0],
    [46, 22, 2, 11, 2, 12],
    [60, 28, 4, 15, 0, 0],
    [66, 26, 4, 13, 1, 14],
    [86, 26, 4, 14, 2, 15],
    [100, 24, 4, 12, 4, 13],
    [122, 28, 6, 15, 2, 16],
    [140, 24, 4, 17, 6, 18],
    [158, 28, 7, 14, 4, 15],
    [180, 22, 12, 15, 4, 16],
    [197, 24, 11, 14, 7, 15],
    [223, 24, 11, 14, 7, 15],
    [253, 30, 3, 15, 13, 16],
    [283, 24, 2, 14, 17, 15],
    [313, 28, 2, 14, 19, 15],
    [341, 26, 9, 13, 16, 14],
    [385, 28, 15, 15, 10, 16],
    [406, 28, 19, 16, 6, 17],
    [442, 28, 34, 13, 0, 0],
    [464, 30, 16, 14, 14, 15],
    [514, 30, 30, 15, 2, 16],
    [538, 30, 22, 14, 13, 15],
    [596, 30, 33, 16, 4, 17],
    [628, 30, 12, 15, 28, 16],
    [661, 30, 11, 15, 31, 16],
    [701, 30, 19, 15, 26, 16],
    [745, 30, 23, 15, 25, 16],
    [793, 30, 23, 15, 28, 16],
    [845, 30, 19, 15, 35, 16],
    [901, 30, 11, 15, 46, 16],
    [961, 30, 59, 16, 1, 17],
    [986, 30, 22, 15, 41, 16],
    [1054, 30, 2, 15, 64, 16],
    [1096, 30, 24, 15, 46, 16],
    [1142, 30, 42, 15, 32, 16],
    [1222, 30, 10, 15, 67, 16],
    [1276, 30, 20, 15, 61, 16],
  ],
};

const ALIGNMENT_PATTERN_POSITIONS: number[][] = [
  [], // 0
  [], // 1
  [6, 18], // 2
  [6, 22], // 3
  [6, 26], // 4
  [6, 30], // 5
  [6, 34], // 6
  [6, 22, 38], // 7
  [6, 24, 42], // 8
  [6, 26, 46], // 9
  [6, 28, 50], // 10
  [6, 30, 54], // 11
  [6, 32, 58], // 12
  [6, 34, 62], // 13
  [6, 26, 46, 66], // 14
  [6, 26, 48, 70], // 15
  [6, 26, 50, 74], // 16
  [6, 30, 54, 78], // 17
  [6, 30, 56, 82], // 18
  [6, 30, 58, 86], // 19
  [6, 34, 62, 90], // 20
  [6, 28, 50, 72, 94], // 21
  [6, 26, 50, 74, 98], // 22
  [6, 30, 54, 78, 102], // 23
  [6, 28, 54, 80, 106], // 24
  [6, 32, 58, 84, 110], // 25
  [6, 30, 58, 86, 114], // 26
  [6, 34, 62, 90, 118], // 27
  [6, 26, 50, 74, 98, 122], // 28
  [6, 30, 54, 78, 102, 126], // 29
  [6, 26, 52, 78, 104, 130], // 30
  [6, 30, 56, 82, 108, 134], // 31
  [6, 34, 60, 86, 112, 138], // 32
  [6, 30, 58, 86, 114, 142], // 33
  [6, 34, 62, 90, 118, 146], // 34
  [6, 30, 54, 78, 102, 126, 150], // 35
  [6, 24, 50, 76, 102, 128, 154], // 36
  [6, 28, 54, 80, 106, 132, 158], // 37
  [6, 32, 58, 84, 110, 136, 162], // 38
  [6, 26, 54, 82, 110, 138, 166], // 39
  [6, 30, 58, 86, 114, 142, 170], // 40
];

/* -------------------------------------------------------------------------- */
/* Bit Stream Helper                                                          */
/* -------------------------------------------------------------------------- */

class BitBuffer {
  buffer: number[] = [];
  length = 0;

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/* -------------------------------------------------------------------------- */
/* QR Code Construction                                                       */
/* -------------------------------------------------------------------------- */

export class QRCodeEncoder {
  static create(text: string, errorCorrectionLevel: ErrorCorrectionLevel = "M"): QRMatrix {
    let rawText = text || " ";
    let utf8Bytes = new TextEncoder().encode(rawText);

    // Try requested EC level first, then fallback to Q, M, L if needed
    const ecFallbackOrder: ErrorCorrectionLevel[] = [
      errorCorrectionLevel,
      ...(errorCorrectionLevel !== "Q" ? ["Q" as ErrorCorrectionLevel] : []),
      ...(errorCorrectionLevel !== "M" ? ["M" as ErrorCorrectionLevel] : []),
      ...(errorCorrectionLevel !== "L" ? ["L" as ErrorCorrectionLevel] : []),
    ];

    let chosenVersion = 0;
    let chosenEcLevel = errorCorrectionLevel;

    for (const ec of ecFallbackOrder) {
      try {
        chosenVersion = QRCodeEncoder.findMinimumVersion(utf8Bytes.length, ec);
        chosenEcLevel = ec;
        break;
      } catch {
        // try next lower EC level
      }
    }

    // If still too large even at Level L (max ~2953 bytes), truncate text safely
    if (!chosenVersion) {
      const maxBytes = 2950;
      const truncatedBytes = utf8Bytes.slice(0, maxBytes);
      utf8Bytes = truncatedBytes;
      chosenVersion = 40;
      chosenEcLevel = "L";
    }

    const dataCodewords = QRCodeEncoder.encodeData(utf8Bytes, chosenVersion, chosenEcLevel);
    const interleavedCodewords = QRCodeEncoder.interleaveBlocks(dataCodewords, chosenVersion, chosenEcLevel);

    // Pick best mask pattern 0..7
    let bestMask = 0;
    let minPenalty = Infinity;
    let bestMatrix: { modules: boolean[][]; moduleTypes: ModuleType[][] } | null = null;

    for (let mask = 0; mask < 8; mask++) {
      const { modules, moduleTypes } = QRCodeEncoder.buildMatrix(
        chosenVersion,
        chosenEcLevel,
        mask,
        interleavedCodewords
      );
      const penalty = QRCodeEncoder.calculatePenalty(modules);
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestMask = mask;
        bestMatrix = { modules, moduleTypes };
      }
    }

    if (!bestMatrix) {
      throw new Error("Failed to generate QR Matrix");
    }

    return {
      version: chosenVersion,
      size: chosenVersion * 4 + 17,
      errorCorrectionLevel: chosenEcLevel,
      maskPattern: bestMask,
      modules: bestMatrix.modules,
      moduleTypes: bestMatrix.moduleTypes,
    };
  }

  private static findMinimumVersion(byteCount: number, ecLevel: ErrorCorrectionLevel): number {
    const eccList = ECC_TABLE[ecLevel];
    for (let v = 1; v <= 40; v++) {
      const maxDataCodewords = eccList[v][0];
      const charCountBits = v <= 9 ? 8 : 16;
      const totalBitsNeeded = 4 + charCountBits + byteCount * 8;
      if (Math.ceil(totalBitsNeeded / 8) <= maxDataCodewords) {
        return v;
      }
    }
    throw new Error(`Data is too large for a single QR code (${byteCount} bytes with EC ${ecLevel})`);
  }

  private static encodeData(data: Uint8Array, version: number, ecLevel: ErrorCorrectionLevel): Uint8Array {
    const buffer = new BitBuffer();
    // 1. Mode Indicator for 8-bit Byte mode: 0100 (4 bits)
    buffer.put(0b0100, 4);

    // 2. Character Count Indicator (8 bits for v1-9, 16 bits for v10-40)
    const countBits = version <= 9 ? 8 : 16;
    buffer.put(data.length, countBits);

    // 3. Data bits
    for (let i = 0; i < data.length; i++) {
      buffer.put(data[i], 8);
    }

    // 4. Terminator (up to 4 zeroes)
    const maxDataCodewords = ECC_TABLE[ecLevel][version][0];
    const maxBits = maxDataCodewords * 8;
    const terminatorLen = Math.min(4, maxBits - buffer.length);
    if (terminatorLen > 0) {
      buffer.put(0, terminatorLen);
    }

    // 5. Pad to byte boundary
    while (buffer.length % 8 !== 0) {
      buffer.putBit(false);
    }

    // 6. Pad with alternating 0xEC and 0x11 until capacity
    const padBytes = [0xec, 0x11];
    let padIndex = 0;
    while (buffer.length < maxBits) {
      buffer.put(padBytes[padIndex % 2], 8);
      padIndex++;
    }

    return buffer.getBytes();
  }

  private static interleaveBlocks(
    dataBytes: Uint8Array,
    version: number,
    ecLevel: ErrorCorrectionLevel
  ): Uint8Array {
    const [, eccPerBlock, g1Blocks, g1DataCount, g2Blocks, g2DataCount] = ECC_TABLE[ecLevel][version];
    const totalBlocks = g1Blocks + g2Blocks;

    const dataBlocks: Uint8Array[] = [];
    const eccBlocks: Uint8Array[] = [];
    let offset = 0;

    for (let i = 0; i < g1Blocks; i++) {
      const slice = dataBytes.slice(offset, offset + g1DataCount);
      dataBlocks.push(slice);
      eccBlocks.push(rsComputeEcc(slice, eccPerBlock));
      offset += g1DataCount;
    }

    for (let i = 0; i < g2Blocks; i++) {
      const slice = dataBytes.slice(offset, offset + g2DataCount);
      dataBlocks.push(slice);
      eccBlocks.push(rsComputeEcc(slice, eccPerBlock));
      offset += g2DataCount;
    }

    // Interleave data codewords
    const result: number[] = [];
    const maxDataLen = Math.max(g1DataCount, g2DataCount);
    for (let i = 0; i < maxDataLen; i++) {
      for (let b = 0; b < totalBlocks; b++) {
        if (i < dataBlocks[b].length) {
          result.push(dataBlocks[b][i]);
        }
      }
    }

    // Interleave ECC codewords
    for (let i = 0; i < eccPerBlock; i++) {
      for (let b = 0; b < totalBlocks; b++) {
        result.push(eccBlocks[b][i]);
      }
    }

    return new Uint8Array(result);
  }

  private static buildMatrix(
    version: number,
    ecLevel: ErrorCorrectionLevel,
    mask: number,
    data: Uint8Array
  ): { modules: boolean[][]; moduleTypes: ModuleType[][] } {
    const size = version * 4 + 17;
    const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    const moduleTypes: ModuleType[][] = Array.from({ length: size }, () => Array(size).fill(ModuleType.DATA));

    // 1. Finder patterns at (0,0), (size-7, 0), (0, size-7)
    const placeFinder = (r0: number, c0: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const row = r0 + r;
          const col = c0 + c;
          if (row < 0 || row >= size || col < 0 || col >= size) continue;
          isFunction[row][col] = true;

          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            const val = isOuter || isInner;
            modules[row][col] = val;
            moduleTypes[row][col] = isInner
              ? ModuleType.FINDER_INNER
              : isOuter
              ? ModuleType.FINDER_OUTER
              : ModuleType.FINDER_SPACE;
          } else {
            // Separator space
            modules[row][col] = false;
            moduleTypes[row][col] = ModuleType.FINDER_SPACE;
          }
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(size - 7, 0);
    placeFinder(0, size - 7);

    // 2. Alignment patterns
    const positions = ALIGNMENT_PATTERN_POSITIONS[version];
    for (const r of positions) {
      for (const c of positions) {
        // Skip if overlaps finder pattern
        if (
          (r < 9 && c < 9) ||
          (r < 9 && c > size - 9) ||
          (r > size - 9 && c < 9)
        ) {
          continue;
        }

        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const row = r + dr;
            const col = c + dc;
            isFunction[row][col] = true;
            const val = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            modules[row][col] = val;
            moduleTypes[row][col] = ModuleType.ALIGNMENT;
          }
        }
      }
    }

    // 3. Timing patterns
    for (let i = 8; i < size - 8; i++) {
      if (!isFunction[6][i]) {
        isFunction[6][i] = true;
        modules[6][i] = i % 2 === 0;
        moduleTypes[6][i] = ModuleType.TIMING;
      }
      if (!isFunction[i][6]) {
        isFunction[i][6] = true;
        modules[i][6] = i % 2 === 0;
        moduleTypes[i][6] = ModuleType.TIMING;
      }
    }

    // 4. Dark module
    isFunction[4 * version + 9][8] = true;
    modules[4 * version + 9][8] = true;
    moduleTypes[4 * version + 9][8] = ModuleType.DARK;

    // 5. Reserve format info areas
    for (let i = 0; i < 9; i++) {
      if (!isFunction[8][i]) {
        isFunction[8][i] = true;
        moduleTypes[8][i] = ModuleType.FORMAT;
      }
      if (!isFunction[i][8]) {
        isFunction[i][8] = true;
        moduleTypes[i][8] = ModuleType.FORMAT;
      }
    }
    for (let i = 0; i < 8; i++) {
      if (!isFunction[8][size - 1 - i]) {
        isFunction[8][size - 1 - i] = true;
        moduleTypes[8][size - 1 - i] = ModuleType.FORMAT;
      }
      if (!isFunction[size - 1 - i][8]) {
        isFunction[size - 1 - i][8] = true;
        moduleTypes[size - 1 - i][8] = ModuleType.FORMAT;
      }
    }

    // 6. Reserve version info areas (for v >= 7)
    if (version >= 7) {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 3; c++) {
          isFunction[r][size - 11 + c] = true;
          moduleTypes[r][size - 11 + c] = ModuleType.VERSION;
          isFunction[size - 11 + c][r] = true;
          moduleTypes[size - 11 + c][r] = ModuleType.VERSION;
        }
      }
    }

    // 7. Place data bits with mask
    let bitIndex = 0;
    const totalBits = data.length * 8;
    let right = size - 1;

    while (right > 0) {
      if (right === 6) right--; // Skip vertical timing column

      for (let vert = 0; vert < size; vert++) {
        for (let colOffset = 0; colOffset < 2; colOffset++) {
          const col = right - colOffset;
          // Upwards if ((right + 1) / 2) is odd, downwards otherwise
          const upwards = ((right + 1) & 2) === 2;
          const row = upwards ? size - 1 - vert : vert;

          if (!isFunction[row][col]) {
            let bit = false;
            if (bitIndex < totalBits) {
              const byteVal = data[Math.floor(bitIndex / 8)];
              bit = ((byteVal >>> (7 - (bitIndex % 8))) & 1) === 1;
              bitIndex++;
            }

            const maskVal = QRCodeEncoder.getMaskBit(mask, row, col);
            modules[row][col] = bit !== maskVal;
            moduleTypes[row][col] = ModuleType.DATA;
          }
        }
      }
      right -= 2;
    }

    // 8. Place format info
    QRCodeEncoder.placeFormatInfo(modules, version, ecLevel, mask);

    // 9. Place version info
    if (version >= 7) {
      QRCodeEncoder.placeVersionInfo(modules, version);
    }

    return { modules, moduleTypes };
  }

  private static getMaskBit(mask: number, r: number, c: number): boolean {
    switch (mask) {
      case 0:
        return (r + c) % 2 === 0;
      case 1:
        return r % 2 === 0;
      case 2:
        return c % 3 === 0;
      case 3:
        return (r + c) % 3 === 0;
      case 4:
        return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5:
        return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6:
        return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7:
        return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
      default:
        return false;
    }
  }

  private static placeFormatInfo(
    modules: boolean[][],
    version: number,
    ecLevel: ErrorCorrectionLevel,
    mask: number
  ): void {
    const size = version * 4 + 17;
    const formatData = (EC_LEVELS[ecLevel].formatBits << 3) | mask;

    // BCH (15, 5) code calculation
    let bch = formatData << 10;
    const G = 0x537; // 10100110111 in binary
    for (let i = 4; i >= 0; i--) {
      if ((bch >>> (i + 10)) & 1) {
        bch ^= G << i;
      }
    }
    const formatBits = ((formatData << 10) | bch) ^ 0x5412; // Mask with 101010000010010

    for (let i = 0; i < 15; i++) {
      const bit = ((formatBits >>> (14 - i)) & 1) === 1;

      // Top-left
      if (i <= 5) {
        modules[8][i] = bit;
      } else if (i === 6) {
        modules[8][7] = bit;
      } else if (i === 7) {
        modules[8][8] = bit;
      } else if (i === 8) {
        modules[7][8] = bit;
      } else {
        modules[14 - i][8] = bit;
      }

      // Bottom-left / Top-right
      if (i < 8) {
        modules[size - 1 - i][8] = bit;
      } else {
        modules[8][size - 15 + i] = bit;
      }
    }
  }

  private static placeVersionInfo(modules: boolean[][], version: number): void {
    const size = version * 4 + 17;
    let bch = version << 12;
    const G = 0x1f25; // 1111100100101 in binary
    for (let i = 5; i >= 0; i--) {
      if ((bch >>> (i + 12)) & 1) {
        bch ^= G << i;
      }
    }
    const versionBits = (version << 12) | bch;

    for (let i = 0; i < 18; i++) {
      const bit = ((versionBits >>> i) & 1) === 1;
      const r = Math.floor(i / 3);
      const c = (i % 3) + size - 11;
      modules[r][c] = bit;
      modules[c][r] = bit;
    }
  }

  private static calculatePenalty(modules: boolean[][]): number {
    const size = modules.length;
    let penalty = 0;

    // Feature 1: Adjacent modules in row/col having same color (5 in a row + 1 per extra)
    for (let r = 0; r < size; r++) {
      let count = 0;
      let lastVal = false;
      for (let c = 0; c < size; c++) {
        if (c === 0 || modules[r][c] !== lastVal) {
          if (count >= 5) penalty += 3 + (count - 5);
          count = 1;
          lastVal = modules[r][c];
        } else {
          count++;
        }
      }
      if (count >= 5) penalty += 3 + (count - 5);
    }

    for (let c = 0; c < size; c++) {
      let count = 0;
      let lastVal = false;
      for (let r = 0; r < size; r++) {
        if (r === 0 || modules[r][c] !== lastVal) {
          if (count >= 5) penalty += 3 + (count - 5);
          count = 1;
          lastVal = modules[r][c];
        } else {
          count++;
        }
      }
      if (count >= 5) penalty += 3 + (count - 5);
    }

    // Feature 2: 2x2 blocks of same color
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const val = modules[r][c];
        if (
          val === modules[r + 1][c] &&
          val === modules[r][c + 1] &&
          val === modules[r + 1][c + 1]
        ) {
          penalty += 3;
        }
      }
    }

    // Feature 3: 1:1:3:1:1 pattern (Dark:Light:Dark:Light:Dark)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - 7; c++) {
        if (
          modules[r][c] &&
          !modules[r][c + 1] &&
          modules[r][c + 2] &&
          modules[r][c + 3] &&
          modules[r][c + 4] &&
          !modules[r][c + 5] &&
          modules[r][c + 6]
        ) {
          // Check 4 light modules before or after
          const beforeLight = c >= 4 && !modules[r][c - 1] && !modules[r][c - 2] && !modules[r][c - 3] && !modules[r][c - 4];
          const afterLight = c <= size - 11 && !modules[r][c + 7] && !modules[r][c + 8] && !modules[r][c + 9] && !modules[r][c + 10];
          if (beforeLight || afterLight) penalty += 40;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - 7; r++) {
        if (
          modules[r][c] &&
          !modules[r + 1][c] &&
          modules[r + 2][c] &&
          modules[r + 3][c] &&
          modules[r + 4][c] &&
          !modules[r + 5][c] &&
          modules[r + 6][c]
        ) {
          const beforeLight = r >= 4 && !modules[r - 1][c] && !modules[r - 2][c] && !modules[r - 3][c] && !modules[r - 4][c];
          const afterLight = r <= size - 11 && !modules[r + 7][c] && !modules[r + 8][c] && !modules[r + 9][c] && !modules[r + 10][c];
          if (beforeLight || afterLight) penalty += 40;
        }
      }
    }

    // Feature 4: Proportion of dark modules
    let darkCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modules[r][c]) darkCount++;
      }
    }
    const percent = (darkCount * 100) / (size * size);
    const prevMultipleOf5 = Math.floor(percent / 5) * 5;
    const nextMultipleOf5 = prevMultipleOf5 + 5;
    const stepDiff = Math.min(
      Math.abs(prevMultipleOf5 - 50) / 5,
      Math.abs(nextMultipleOf5 - 50) / 5
    );
    penalty += stepDiff * 10;

    return penalty;
  }
}
