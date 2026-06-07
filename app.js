const btnRecord     = document.getElementById('btn-record');
const btnAgain      = document.getElementById('btn-again');
const btnDownload   = document.getElementById('btn-download');
const timerDisplay  = document.getElementById('timer-display');
const statusText    = document.getElementById('status-text');
const spinnerOverlay = document.getElementById('spinner-overlay');
const resultZone    = document.getElementById('result-zone');
const audioOriginal = document.getElementById('audio-original');
const audioMickey   = document.getElementById('audio-mickey');

let state = 'idle';
let recorder = null;
let stream = null;
let chunks = [];
let timerInterval = null;
let timerSeconds = 0;
let originalBlobUrl = null;
let mickeyBlobUrl = null;

function setState(next) {
  state = next;
  btnRecord.disabled = (next === 'processing');

  if (next === 'idle') {
    btnRecord.classList.remove('recording');
    btnRecord.querySelector('.btn-label').textContent = 'Aufnahme starten';
    btnRecord.querySelector('.btn-icon').textContent = '●';
    timerDisplay.textContent = '00:00';
    statusText.textContent = 'Klicke auf den Button und sprich!';
    spinnerOverlay.classList.add('hidden');
    resultZone.classList.add('hidden');
  } else if (next === 'recording') {
    btnRecord.classList.add('recording');
    btnRecord.querySelector('.btn-label').textContent = 'Aufnahme stoppen';
    btnRecord.querySelector('.btn-icon').textContent = '■';
    statusText.textContent = 'Aufnahme läuft...';
  } else if (next === 'processing') {
    btnRecord.classList.remove('recording');
    spinnerOverlay.classList.remove('hidden');
    statusText.textContent = 'Wird verarbeitet...';
  } else if (next === 'ready') {
    spinnerOverlay.classList.add('hidden');
    resultZone.classList.remove('hidden');
    statusText.textContent = 'Fertig! Viel Spaß mit deiner Balu-Stimme!';
    btnRecord.querySelector('.btn-label').textContent = 'Aufnahme starten';
    btnRecord.querySelector('.btn-icon').textContent = '●';
  }
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  timerSeconds = 0;
  timerDisplay.textContent = formatTime(0);
  timerInterval = setInterval(() => {
    timerSeconds++;
    timerDisplay.textContent = formatTime(timerSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function revokeOldUrls() {
  if (originalBlobUrl) { URL.revokeObjectURL(originalBlobUrl); originalBlobUrl = null; }
  if (mickeyBlobUrl)   { URL.revokeObjectURL(mickeyBlobUrl);   mickeyBlobUrl = null; }
}

async function startRecording() {
  await Tone.start();

  if (!stream) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      statusText.textContent = 'Kein Mikrofon-Zugriff. Bitte Berechtigung erteilen.';
      return;
    }
  }

  const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
    .find(t => MediaRecorder.isTypeSupported(t)) || '';

  chunks = [];
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  recorder.onstop = async () => {
    stopTimer();
    setState('processing');

    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    revokeOldUrls();
    originalBlobUrl = URL.createObjectURL(blob);
    audioOriginal.src = originalBlobUrl;

    setTimeout(async () => {
      try {
        const wavBlob = await processAudio(blob);
        mickeyBlobUrl = URL.createObjectURL(wavBlob);
        audioMickey.src = mickeyBlobUrl;
        btnDownload.href = mickeyBlobUrl;
        btnDownload.download = `balu-stimme-${Date.now()}.wav`;
        setState('ready');
      } catch (err) {
        console.error(err);
        statusText.textContent = 'Fehler bei der Verarbeitung. Bitte erneut versuchen.';
        spinnerOverlay.classList.add('hidden');
        setState('idle');
      }
    }, 0);
  };

  recorder.start(100);
  startTimer();
  setState('recording');
}

function stopRecording() {
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop();
  }
}

btnRecord.addEventListener('click', () => {
  if (state === 'idle' || state === 'ready') {
    if (state === 'ready') {
      setState('idle');
    }
    startRecording();
  } else if (state === 'recording') {
    stopRecording();
  }
});

btnAgain.addEventListener('click', () => {
  setState('idle');
  revokeOldUrls();
  audioOriginal.src = '';
  audioMickey.src = '';
  startRecording();
});
