const assert = require('assert');
const fs = require('fs');

function readWebpDimensions(filePath) {
  const data = fs.readFileSync(filePath);
  assert.strictEqual(data.toString('ascii', 0, 4), 'RIFF', filePath + ' is not a RIFF container');
  assert.strictEqual(data.toString('ascii', 8, 12), 'WEBP', filePath + ' is not a WebP image');

  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunkType = data.toString('ascii', offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);
    const payload = offset + 8;

    if (chunkType === 'VP8X' && payload + 10 <= data.length) {
      return {
        width: 1 + data.readUIntLE(payload + 4, 3),
        height: 1 + data.readUIntLE(payload + 7, 3),
      };
    }
    if (chunkType === 'VP8L' && payload + 5 <= data.length) {
      assert.strictEqual(data[payload], 0x2f, filePath + ' has an invalid VP8L signature');
      const bits = data.readUInt32LE(payload + 1);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >>> 14) & 0x3fff),
      };
    }
    if (chunkType === 'VP8 ' && payload + 10 <= data.length) {
      assert.strictEqual(
        data.toString('hex', payload + 3, payload + 6),
        '9d012a',
        filePath + ' has an invalid VP8 key-frame signature'
      );
      return {
        width: data.readUInt16LE(payload + 6) & 0x3fff,
        height: data.readUInt16LE(payload + 8) & 0x3fff,
      };
    }

    offset = payload + chunkSize + (chunkSize % 2);
  }

  assert.fail(filePath + ' has no supported WebP image chunk');
}

function readPngDimensions(filePath) {
  const data = fs.readFileSync(filePath);
  assert(data.length >= 24, filePath + ' is too small to be a PNG image');
  assert.strictEqual(data.toString('hex', 0, 8), '89504e470d0a1a0a', filePath + ' has an invalid PNG signature');
  assert.strictEqual(data.toString('ascii', 12, 16), 'IHDR', filePath + ' has no leading IHDR chunk');
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

function readImageDimensions(filePath) {
  const data = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
  const head = data.toString('ascii', 0, 12);
  let size;
  if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') size = readWebpDimensions(filePath);
  else if (data.toString('hex', 0, 8) === '89504e470d0a1a0a') size = readPngDimensions(filePath);
  else assert.fail(filePath + ' is not a supported WebP or PNG scene image');
  assert(size.width > 0 && size.height > 0, filePath + ' has invalid zero dimensions');
  return size;
}

module.exports = { readWebpDimensions, readPngDimensions, readImageDimensions };
