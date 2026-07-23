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

module.exports = { readWebpDimensions };
