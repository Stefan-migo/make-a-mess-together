const dgram = require('dgram');

class OscSender {
  constructor(host = '127.0.0.1', port = 9000) {
    this.host = host;
    this.port = port;
    this.socket = dgram.createSocket('udp4');
  }

  static _packOsc(address, types, typesArgs) {
    const addrNullTerminated = address + '\0';
    const typeTag = ',' + types + '\0';

    const addrLen = addrNullTerminated.length;
    const addrPad = (4 - (addrLen % 4)) % 4;

    const typeLen = typeTag.length;
    const typePad = (4 - (typeLen % 4)) % 4;

    const totalLength = addrLen + addrPad + typeLen + typePad + typesArgs.length * 4;
    const buf = Buffer.alloc(totalLength, 0);

    buf.write(addrNullTerminated, 0, addrLen, 'ascii');
    let offset = addrLen + addrPad;

    buf.write(typeTag, offset, typeLen, 'ascii');
    offset += typeLen + typePad;

    for (let i = 0; i < typesArgs.length; i++) {
      const typeChar = types[i];
      if (typeChar === 'f') {
        const val = (typeof typesArgs[i] === 'number' && !isNaN(typesArgs[i]) && isFinite(typesArgs[i]))
          ? typesArgs[i] : 0;
        buf.writeFloatBE(val, offset);
      } else if (typeChar === 'i') {
        buf.writeInt32BE(Math.floor(typesArgs[i]), offset);
      }
      offset += 4;
    }

    return buf;
  }

  _send(buffer) {
    this.socket.send(buffer, this.port, this.host);
  }

  sendAccel(slot, x, y, z) {
    const buf = OscSender._packOsc(`/device/${slot}/accel`, 'fff', [x, y, z]);
    this._send(buf);
  }

  sendGyro(slot, a, b, g) {
    const buf = OscSender._packOsc(`/device/${slot}/gyro`, 'fff', [a, b, g]);
    this._send(buf);
  }

  sendOrientation(slot, a, b, g) {
    const buf = OscSender._packOsc(`/device/${slot}/orientation`, 'fff', [a, b, g]);
    this._send(buf);
  }

  sendAssign(slot) {
    const buf = OscSender._packOsc('/system/assign', 'i', [slot]);
    this._send(buf);
  }

  sendDisconnect(slot) {
    const buf = OscSender._packOsc('/system/disconnect', 'i', [slot]);
    this._send(buf);
  }

  sendCount(count) {
    const buf = OscSender._packOsc('/system/count', 'i', [count]);
    this._send(buf);
  }

  close() {
    this.socket.close();
  }
}

module.exports = { OscSender };
