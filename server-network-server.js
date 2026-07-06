const crypto = require("crypto");

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function createWebSocketAcceptKey(key) {
  return crypto
    .createHash("sha1")
    .update(`${key}${WS_GUID}`)
    .digest("base64");
}

function createWebSocketHandshakeResponse(key) {
  const acceptKey = createWebSocketAcceptKey(key);
  return (
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\n" +
    "Connection: Upgrade\r\n" +
    `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`
  );
}

function readFrame(buffer) {
  if (buffer.length < 2) return null;

  const first = buffer[0];
  const second = buffer[1];
  const opcode = first & 0x0f;
  const masked = (second & 0x80) === 0x80;
  let length = second & 0x7f;
  let offset = 2;

  if (length === 126) {
    if (buffer.length < offset + 2) return null;
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    if (buffer.length < offset + 8) return null;
    const high = buffer.readUInt32BE(offset);
    const low = buffer.readUInt32BE(offset + 4);
    length = high * 2 ** 32 + low;
    offset += 8;
  }

  const maskLength = masked ? 4 : 0;
  if (buffer.length < offset + maskLength + length) return null;

  let mask;
  if (masked) {
    mask = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  const payload = Buffer.from(buffer.slice(offset, offset + length));
  if (masked) {
    for (let i = 0; i < payload.length; i += 1) {
      payload[i] ^= mask[i % 4];
    }
  }

  return {
    opcode,
    payload,
    offset: offset + length
  };
}

function encodeTextPayload(payload) {
  let header;

  if (payload.length <= 125) {
    header = Buffer.from([0x81, payload.length]);
  } else if (payload.length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }

  return Buffer.concat([header, payload]);
}

function encodeJsonFrame(message) {
  return encodeTextPayload(Buffer.from(JSON.stringify(message)));
}

function writeJson(socket, message) {
  if (!socket || socket.destroyed) return false;
  socket.write(encodeJsonFrame(message));
  return true;
}

module.exports = {
  createWebSocketAcceptKey,
  createWebSocketHandshakeResponse,
  encodeJsonFrame,
  encodeTextPayload,
  readFrame,
  writeJson
};
