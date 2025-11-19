const DEFAULT_GOAL_MINUTES = 6;
const STORAGE_KEY = 'squat-hang-state';

const goalInput = document.getElementById('goal-minutes');
const axeAudioElement = document.getElementById('axe-audio');
const CAPOEIRA_TRACK_URL =
  'https://cdn.pixabay.com/download/audio/2022/06/26/audio_6991a232540.mp3?filename=capoeira-112448.mp3';

if (axeAudioElement) {
  hydrateCapoeiraAudio();
}
const CIRCLE_RADIUS = 54;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const timerElements = {
  squat: {
    card: document.querySelector('[data-timer="squat"]'),
    time: document.getElementById('time-squat'),
    status: document.getElementById('status-squat'),
    progress: document.getElementById('progress-squat'),
    progressLabel: document.getElementById('progress-label-squat'),
    toggle: document.getElementById('toggle-squat'),
    reset: document.getElementById('reset-squat'),
  },
  hang: {
    card: document.querySelector('[data-timer="hang"]'),
    time: document.getElementById('time-hang'),
    status: document.getElementById('status-hang'),
    progress: document.getElementById('progress-hang'),
    progressLabel: document.getElementById('progress-label-hang'),
    toggle: document.getElementById('toggle-hang'),
    reset: document.getElementById('reset-hang'),
  },
};

Object.values(timerElements).forEach(({ progress }) => {
  const circumference = CIRCLE_CIRCUMFERENCE.toString();
  progress.style.strokeDasharray = circumference;
  progress.style.strokeDashoffset = '0';
});

let state = loadState();
let rafId = null;
let lastFrameTime = null;

clampTimersToGoal();
goalInput.value = state.goalMinutes;

goalInput.addEventListener('input', (event) => {
  const numericValue = Number.parseInt(event.target.value, 10);
  const value = Math.max(1, Number.isNaN(numericValue) ? DEFAULT_GOAL_MINUTES : numericValue);
  state.goalMinutes = value;
  goalInput.value = value;
  clampTimersToGoal();
  saveState();
  updateAllDisplays();
});

Object.entries(timerElements).forEach(([key, elements]) => {
  elements.toggle.addEventListener('click', () => toggleTimer(key));
  elements.reset.addEventListener('click', () => resetTimer(key));
});

updateAllDisplays();
resumeIfRunning();

window.addEventListener('focus', resumeIfRunning);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    resumeIfRunning();
  }
});

function toggleTimer(timerKey) {
  syncRunningTimers();
  const timer = state.timers[timerKey];
  const goalMs = getGoalMs();
  if (!timer.running && timer.elapsedMs >= goalMs) {
    return;
  }

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
  let stateChanged = false;

  Object.values(state.timers).forEach((timer) => {
    if (timer.running && timer.lastStartedAt) {
      timer.elapsedMs += now - timer.lastStartedAt;
      timer.lastStartedAt = now;
      const goalMs = getGoalMs();
      if (timer.elapsedMs >= goalMs) {
        timer.elapsedMs = goalMs;
        timer.running = false;
        timer.lastStartedAt = null;
      } else {
        shouldStart = true;
      }
      stateChanged = true;
    }
  });

  if (shouldStart) {
    startTicker();
  } else if (!anyTimerRunning()) {
    stopTicker();
  }

  if (stateChanged) {
    saveState();
    updateAllDisplays();
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
      const goalMs = getGoalMs();
      if (timer.elapsedMs >= goalMs) {
        timer.elapsedMs = goalMs;
        timer.running = false;
        timer.lastStartedAt = null;
      } else {
        runningCount += 1;
      }
    }
    updateTimerDisplay(timerKey);
  });

  if (runningCount > 0) {
    saveState();
    rafId = requestAnimationFrame(updateFrame);
  } else {
    saveState();
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
      const goalMs = getGoalMs();
      if (timer.elapsedMs >= goalMs) {
        timer.elapsedMs = goalMs;
        timer.running = false;
        timer.lastStartedAt = null;
      }
    }
  });
}

function updateAllDisplays() {
  Object.keys(state.timers).forEach(updateTimerDisplay);
}

function updateTimerDisplay(timerKey) {
  const timer = state.timers[timerKey];
  const elements = timerElements[timerKey];
  const goalMs = getGoalMs();

  if (timer.elapsedMs > goalMs) {
    timer.elapsedMs = goalMs;
  }

  const remainingMs = Math.max(0, goalMs - timer.elapsedMs);
  const completedMs = goalMs - remainingMs;
  const progressRatio = goalMs === 0 ? 0 : Math.min(1, completedMs / goalMs);
  const isComplete = remainingMs === 0;

  elements.time.textContent = formatTime(remainingMs);
  elements.status.textContent = timer.running ? 'Flowing' : isComplete ? 'Complete' : 'Paused';
  elements.toggle.textContent = timer.running ? 'Pause' : 'Start';
  elements.toggle.disabled = isComplete;
  elements.toggle.setAttribute('aria-disabled', isComplete ? 'true' : 'false');
  elements.card.classList.toggle('timer-card--complete', isComplete);

  const offset = CIRCLE_CIRCUMFERENCE * progressRatio;
  elements.progress.style.strokeDashoffset = offset;
  elements.progressLabel.textContent = `Goal: ${state.goalMinutes} min`;
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
    safeState.goalMinutes = Math.floor(rawState.goalMinutes);
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

function clampTimersToGoal() {
  const goalMs = getGoalMs();
  Object.values(state.timers).forEach((timer) => {
    if (timer.elapsedMs > goalMs) {
      timer.elapsedMs = goalMs;
      timer.running = false;
      timer.lastStartedAt = null;
    }
  });
}

function getGoalMs() {
  return state.goalMinutes * 60 * 1000;
}

