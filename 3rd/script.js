const audio = document.getElementById('voiceMessage');
const barsContainer = document.getElementById('waveformBars');
const messageContainer = document.getElementById('message');
const playPauseBtn = document.getElementById('playPauseBtn');
const icon = playPauseBtn.querySelector('i');

let barCount = 40;
let bars = [];
let animationRunning = false;

async function createStaticWaveform() {
  barsContainer.innerHTML = '';
  bars = [];

  const context = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch(audio.src);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await context.decodeAudioData(arrayBuffer);
  const rawData = audioBuffer.getChannelData(0); // mono channel
  const samplesPerBar = Math.floor(rawData.length / barCount);

  for (let i = 0; i < barCount; i++) {
    let sum = 0;
    for (let j = 0; j < samplesPerBar; j++) {
      const sampleIndex = i * samplesPerBar + j;
      sum += Math.abs(rawData[sampleIndex]);
    }
    const average = sum / samplesPerBar;
    const height = Math.max(10, average * 200); // scale height

    const bar = document.createElement('div');
    bar.classList.add('voice-bar');
    bar.style.height = `${height}px`;
    barsContainer.appendChild(bar);
    bars.push(bar);
  }
}


function updateWaveformProgress() {
  const progress = audio.currentTime / audio.duration;
  const activeBars = Math.floor(progress * barCount);

  bars.forEach((bar, index) => {
    bar.classList.toggle('active', index < activeBars);
  });

  const timeDisplay = document.getElementById('audioTime');
  if (timeDisplay) {
    const minutes = Math.floor(audio.currentTime / 60);
    const seconds = Math.floor(audio.currentTime % 60)
      .toString()
      .padStart(2, '0');
    timeDisplay.textContent = `${minutes}:${seconds}`;
  }

  if (!audio.paused && !audio.ended) {
    requestAnimationFrame(updateWaveformProgress);
  }
}


function toggleAudio() {
  if (audio.paused) {
    if (bars.length === 0) {
      createStaticWaveform();
    }

    barsContainer.style.display = 'flex';
    audio.play();
    icon.classList.remove('bi-play-fill');
    icon.classList.add('bi-pause-fill');

    if (!animationRunning) {
      animationRunning = true;
      requestAnimationFrame(updateWaveformProgress);
    }
  } else {
    audio.pause();
    icon.classList.remove('bi-pause-fill');
    icon.classList.add('bi-play-fill');
  }
}

barsContainer.addEventListener('click', (e) => {
  const rect = barsContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;

  audio.currentTime = percent * audio.duration;
  updateWaveformProgress();
});

audio.addEventListener('pause', () => {
  icon.classList.remove('bi-pause-fill');
  icon.classList.add('bi-play-fill');
});

audio.addEventListener('ended', () => {
  barsContainer.style.display = 'none';
  messageContainer.textContent = '';
  icon.classList.remove('bi-pause-fill');
  icon.classList.add('bi-play-fill');
  animationRunning = false;
});

window.onload = createStaticWaveform;
document.getElementById('audioTime').textContent = formatTime(audio.currentTime);