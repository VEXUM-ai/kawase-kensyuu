// 簡易的なPNGアイコンを作成（1x1のピクセルデータ）
const fs = require('fs');

// 最小限の有効なPNGファイルを作成（グラデーションカラー）
function createSimplePNG(size, filename) {
    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk (画像ヘッダー)
    const width = size;
    const height = size;
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8);  // bit depth
    ihdr.writeUInt8(2, 9);  // color type (RGB)
    ihdr.writeUInt8(0, 10); // compression
    ihdr.writeUInt8(0, 11); // filter
    ihdr.writeUInt8(0, 12); // interlace

    const ihdrChunk = createChunk('IHDR', ihdr);

    // IDAT chunk (画像データ) - グラデーションカラー
    const pixelData = Buffer.alloc(size * size * 3);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 3;
            // グラデーション計算
            const ratio = (x + y) / (size * 2);
            pixelData[idx] = Math.floor(102 + (118 - 102) * ratio);     // R
            pixelData[idx + 1] = Math.floor(126 + (75 - 126) * ratio);  // G
            pixelData[idx + 2] = Math.floor(234 + (162 - 234) * ratio); // B
        }
    }

    const zlib = require('zlib');
    const compressed = zlib.deflateSync(pixelData);
    const idatChunk = createChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    // 全体を結合
    const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
    fs.writeFileSync(filename, png);
    console.log(`Created ${filename}`);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crc = calculateCRC(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(buffer) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// アイコン生成
createSimplePNG(192, 'icon-192.png');
createSimplePNG(512, 'icon-512.png');
