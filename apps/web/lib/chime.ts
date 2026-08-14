// Sonido de aviso reutilizable, con "desbloqueo" para la política de autoplay
// de los navegadores (el audio no suena hasta que el usuario interactúa una vez).

let ctx: AudioContext | null = null;
let unlockInstalled = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

/// Desbloquea el audio en el primer clic/tecla/toque del usuario (una vez).
export function initAudioUnlock() {
  if (typeof window === 'undefined' || unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchstart', unlock);
}

/// Timbre corto de notificación (dos tonos ascendentes).
export function chime() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, c.currentTime);
    o.frequency.setValueAtTime(1175, c.currentTime + 0.12);
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35);
    o.start();
    o.stop(c.currentTime + 0.36);
  } catch { /* ignore */ }
}
