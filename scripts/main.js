const DEFAULT_GOAL_MINUTES = 10;
const STORAGE_KEY = 'squat-hang-state';

const goalInput = document.getElementById('goal-minutes');

const timerElements = {
  squat: {
    time: document.getElementById('time-squat'),
    status: document.getElementById('status-squat'),
    progress: document.getElementById('progress-squat'),
    progressLabel: document.getElementById('progress-label-squat'),
    toggle: document.getElementById('toggle-squat'),
    reset: document.getElementById('reset-squat'),
  },
  hang: {
    time: document.getElementById('time-hang'),
    status: document.getElementById('status-hang'),
    progress: document.getElementById('progress-hang'),
    progressLabel: document.getElementById('progress-label-hang'),
    toggle: document.getElementById('toggle-hang'),
    reset: document.getElementById('reset-hang'),
  },
};

let state = loadState();
let rafId = null;
let lastFrameTime = null;

goalInput.value = state.goalMinutes;
goalInput.addEventListener('input', (event) => {
  const value = Math.max(1, Number(event.target.value) || DEFAULT_GOAL_MINUTES);
  state.goalMinutes = value;
  goalInput.value = value;
  saveState();
  updateAllDisplays();
});

Object.entries(timerElements).forEach(([key, elements]) => {
  elements.toggle.addEventListener('click', () => toggleTimer(key));
  elements.reset.addEventListener('click', () => resetTimer(key));
});

// Kick off UI with persisted state
updateAllDisplays();
resumeIfRunning();

function toggleTimer(timerKey) {
  syncRunningTimers();
  const timer = state.timers[timerKey];
  timer.running = !timer.running;
  timer.lastStartedAt = timer.running ? Date.now() : null;

  if (timer.running) {
    startTicker();
  } else if (!anyTimerRunning()) {
    stopTicker();
  }

  saveState();
  updateTimerDisplay(timerKey);
}

function resetTimer(timerKey) {
  syncRunningTimers();
  const timer = state.timers[timerKey];
  timer.running = false;
  timer.elapsedMs = 0;
  timer.lastStartedAt = null;
  if (!anyTimerRunning()) {
    stopTicker();
  }
  saveState();
  updateTimerDisplay(timerKey);
}

function resumeIfRunning() {
  const now = Date.now();
  let shouldStart = false;

  Object.values(state.timers).forEach((timer) => {
    if (timer.running && timer.lastStartedAt) {
      timer.elapsedMs += now - timer.lastStartedAt;
      timer.lastStartedAt = now;
      shouldStart = true;
    }
  });

  if (shouldStart) {
    startTicker();
  }
}

function startTicker() {
  if (rafId) return;
  lastFrameTime = null;
  rafId = requestAnimationFrame(updateFrame);
}

function stopTicker() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastFrameTime = null;
}

function updateFrame(timestamp) {
  if (lastFrameTime === null) {
    lastFrameTime = timestamp;
  }
  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  let runningCount = 0;
  Object.entries(state.timers).forEach(([timerKey, timer]) => {
    if (timer.running) {
      timer.elapsedMs += delta;
      timer.lastStartedAt = Date.now();
      runningCount += 1;
    }
    updateTimerDisplay(timerKey);
  });

  if (runningCount > 0) {
    saveState();
    rafId = requestAnimationFrame(updateFrame);
  } else {
    stopTicker();
  }
}

function syncRunningTimers() {
  if (!rafId || lastFrameTime === null) return;
  const now = performance.now();
  const delta = now - lastFrameTime;
  lastFrameTime = now;
  Object.values(state.timers).forEach((timer) => {
    if (timer.running) {
      timer.elapsedMs += delta;
      timer.lastStartedAt = Date.now();
    }
  });
}

function updateAllDisplays() {
  Object.keys(state.timers).forEach(updateTimerDisplay);
}

function updateTimerDisplay(timerKey) {
  const timer = state.timers[timerKey];
  const elements = timerElements[timerKey];
  const displayMs = timer.running && lastFrameTime === null ? timer.elapsedMs : timer.elapsedMs;

  elements.time.textContent = formatTime(displayMs);
  elements.status.textContent = timer.running ? 'Running' : 'Paused';
  elements.toggle.textContent = timer.running ? 'Pause' : 'Start';

  const goalMs = state.goalMinutes * 60 * 1000;
  const percent = Math.min(100, Math.floor((timer.elapsedMs / goalMs) * 100));
  elements.progress.style.width = `${percent}%`;
  elements.progressLabel.textContent = `${percent}% of daily goal`;
}

function anyTimerRunning() {
  return Object.values(state.timers).some((timer) => timer.running);
}

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function loadState() {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return normalizeState(parsed);
    } catch (error) {
      console.warn('Could not parse saved state, resetting.', error);
    }
  }
  return createDefaultState();
}

function saveState() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createDefaultState() {
  return {
    goalMinutes: DEFAULT_GOAL_MINUTES,
    timers: {
      squat: { elapsedMs: 0, running: false, lastStartedAt: null },
      hang: { elapsedMs: 0, running: false, lastStartedAt: null },
    },
  };
}

function normalizeState(rawState) {
  const safeState = createDefaultState();

  if (typeof rawState.goalMinutes === 'number' && rawState.goalMinutes > 0) {
    safeState.goalMinutes = rawState.goalMinutes;
  }

  ['squat', 'hang'].forEach((key) => {
    const incoming = rawState.timers?.[key];
    if (!incoming) return;

    safeState.timers[key].elapsedMs = Number(incoming.elapsedMs) || 0;
    safeState.timers[key].running = Boolean(incoming.running);
    safeState.timers[key].lastStartedAt = incoming.lastStartedAt || null;
  });

  return safeState;
}
