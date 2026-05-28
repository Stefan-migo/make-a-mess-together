const midi = require('@julusian/midi');

class MidiSender {
  constructor() {
    this.output = new midi.Output();
    this.output.openVirtualPort('phone-sensor-orchestra');
  }

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  _channelStatus(base, channel) {
    return base | (channel & 0x0f);
  }

  sendNoteOn(channel, note, velocity) {
    const ch = channel & 0x0f;
    const n = this._clamp(note, 0, 127);
    const v = this._clamp(velocity, 0, 127);
    this.output.sendMessage([0x90 | ch, n, v]);
  }

  sendNoteOff(channel, note, velocity) {
    const ch = channel & 0x0f;
    const n = this._clamp(note, 0, 127);
    const v = this._clamp(velocity, 0, 127);
    this.output.sendMessage([0x80 | ch, n, v]);
  }

  sendCC(channel, cc, value) {
    const ch = channel & 0x0f;
    const c = this._clamp(cc, 0, 127);
    const v = this._clamp(value, 0, 127);
    this.output.sendMessage([0xB0 | ch, c, v]);
  }

  sendPitchBend(channel, value14) {
    const ch = channel & 0x0f;
    const v = this._clamp(value14, 0, 16383);
    const lsb = v & 0x7f;
    const msb = (v >> 7) & 0x7f;
    this.output.sendMessage([0xE0 | ch, lsb, msb]);
  }

  allNotesOff(channel) {
    this.sendCC(channel, 123, 0);
  }

  close() {
    this.output.closePort();
  }
}

module.exports = { MidiSender };
