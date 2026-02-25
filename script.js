const btnRecord = document.getElementById("btnRecord");
const btnStop   = document.getElementById("btnStop");
const btnPlay   = document.getElementById("btnPlay");
const btnClear  = document.getElementById("btnClear");
const statusEl  = document.getElementById("status");
const player    = document.getElementById("player");

let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let audioUrl = null;

function setStatus(msg) {
  statusEl.textContent = `Status: ${msg}`;
}

function supportsRecording() {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

function resetAudio() {
  audioChunks = [];
  audioBlob = null;
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = null;
  player.hidden = true;
  player.removeAttribute("src");
  btnPlay.disabled = true;
  btnClear.disabled = true;
}

btnRecord.addEventListener("click", async () => {
  if (!supportsRecording()) {
    setStatus("This browser doesn't support recording (MediaRecorder). Try Chrome/Edge.");
    return;
  }

  try {
    resetAudio();
    setStatus("requesting microphone permission…");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Pick a supported mimeType if possible
    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg"
    ];
    const options = {};
    for (const t of preferredTypes) {
      if (MediaRecorder.isTypeSupported(t)) { options.mimeType = t; break; }
    }

    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      // Stop mic
      stream.getTracks().forEach(track => track.stop());

      audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      audioUrl = URL.createObjectURL(audioBlob);

      player.src = audioUrl;
      player.hidden = false;

      btnPlay.disabled = false;
      btnClear.disabled = false;

      setStatus("recorded ✅ ready to play");
    };

    mediaRecorder.start();
    btnRecord.disabled = true;
    btnStop.disabled = false;
    setStatus("recording… speak now");
  } catch (err) {
    setStatus(`mic permission blocked or error: ${err?.message || err}`);
  }
});

btnStop.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  btnStop.disabled = true;
  btnRecord.disabled = false;
  setStatus("stopping…");
});

btnPlay.addEventListener("click", async () => {
  if (!audioUrl) return;
  try {
    await player.play();
    setStatus("playing ▶️");
  } catch {
    setStatus("tap the player controls to play (autoplay blocked).");
  }
});

btnClear.addEventListener("click", () => {
  resetAudio();
  setStatus("cleared (idle)");
});
