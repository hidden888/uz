const PITCH_SEMITONES = 9;
const WINDOW_SIZE = 0.1;

async function processAudio(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const duration = audioBuffer.duration + 0.5;
  const blobUrl = URL.createObjectURL(blob);

  const rendered = await Tone.Offline(async () => {
    const player = new Tone.Player(blobUrl);
    await Tone.loaded();

    const pitchShift = new Tone.PitchShift({
      pitch: PITCH_SEMITONES,
      windowSize: WINDOW_SIZE,
    });

    player.connect(pitchShift);
    pitchShift.toDestination();
    player.start(0);
  }, duration);

  URL.revokeObjectURL(blobUrl);

  return audioBufferToWav(rendered.get());
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bitsPerSample = 32;
  const bytesPerSample = bitsPerSample / 8;
  const dataLength = numSamples * numChannels * bytesPerSample;
  const arrayBuf = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuf);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 3, true);               // IEEE float
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);

  const channels = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      view.setFloat32(offset, channels[c][i], true);
      offset += 4;
    }
  }

  return new Blob([arrayBuf], { type: 'audio/wav' });
}
