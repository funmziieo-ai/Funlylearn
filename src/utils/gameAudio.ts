// FunlyLearn game audio engine
//
// Original Afrobeat-style game music (talking drum, shekere, kick,
// marimba, bass), generated live in the browser, so there are no
// music files to download. Good for children on low data.
//
// Two tracks, like Kahoot's lobby and countdown music:
//   'hub'  - relaxed theme while the child browses Naija Lingo
//   'game' - faster, more exciting track during a game
//
// To use a real recorded song instead, put an MP3 you have the rights
// to use in /public/audio/ and set its path in MUSIC_FILES below. The
// file then plays (looped) instead of the generated track.

export type MusicTrack = 'hub' | 'game';
export type SoundEffect =
  | 'correct' | 'wrong' | 'coin' | 'tap' | 'count' | 'go'
  | 'combo' | 'win' | 'unlock' | 'whoosh' | 'splash';

const MUSIC_FILES: Partial<Record<MusicTrack, string>> = {
  // hub: '/audio/lingo-hub.mp3',
  // game: '/audio/lingo-game.mp3',
};

const MUSIC_VOLUME = 0.32;
const DUCKED_VOLUME = 0.06;
const SFX_VOLUME = 0.7;
const PREFS_KEY = 'funlylearn_game_audio_prefs';

interface AudioPrefs { music: boolean; sfx: boolean; }

function loadPrefs(): AudioPrefs {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) return { music: true, sfx: true, ...JSON.parse(saved) };
  } catch (_e) {}
  return { music: true, sfx: true };
}

function savePrefs(prefs: AudioPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (_e) {}
}

const TRACKS: Record<MusicTrack, {
  bpm: number;
  kick: number[];
  drums: Record<number, number>;
  melody: number[][];
  bass: number[];
}> = {
  hub: {
    bpm: 100,
    kick: [0, 10],
    drums: { 3: 220, 7: 262, 14: 196 },
    melody: [
      [392, 0, 0, 440, 0, 0, 523, 0],
      [440, 0, 0, 392, 0, 0, 330, 0],
      [392, 0, 0, 440, 0, 0, 587, 523],
      [440, 0, 392, 0, 330, 0, 294, 0]
    ],
    bass: [98, 82, 110, 73]
  },
  game: {
    bpm: 124,
    kick: [0, 6, 10],
    drums: { 3: 220, 7: 262, 11: 196, 14: 233, 15: 262 },
    melody: [
      [523, 0, 587, 0, 659, 0, 587, 523],
      [440, 0, 523, 0, 587, 0, 523, 440],
      [523, 0, 659, 0, 784, 0, 659, 587],
      [587, 0, 523, 0, 440, 0, 392, 0]
    ],
    bass: [131, 110, 147, 98]
  }
};

class GameAudio {
  private ctx: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private fileAudio: HTMLAudioElement | null = null;
  private step = 0;
  private nextTime = 0;
  private track: MusicTrack | null = null;
  private ducked = false;
  private prefs: AudioPrefs = loadPrefs();
  private listeners = new Set<() => void>();

  // ---------- setup ----------
  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = MUSIC_VOLUME;
      this.musicBus.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = SFX_VOLUME;
      this.sfxBus.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  // Tries to turn sound on. Returns false if the browser is still
  // blocking sound until the person taps the page.
  async unlock(): Promise<boolean> {
    const ctx = this.ensure();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 400))]);
      } catch (_e) {}
    }
    return ctx.state === 'running';
  }

  isUnlocked(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  // ---------- settings ----------
  isMusicEnabled() { return this.prefs.music; }
  isSfxEnabled() { return this.prefs.sfx; }

  setMusicEnabled(on: boolean) {
    this.prefs = { ...this.prefs, music: on };
    savePrefs(this.prefs);
    if (!on) {
      this.stopSound();
    } else if (this.track) {
      this.playMusic(this.track);
    }
    this.emit();
  }

  setSfxEnabled(on: boolean) {
    this.prefs = { ...this.prefs, sfx: on };
    savePrefs(this.prefs);
    this.emit();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private emit() {
    this.listeners.forEach(fn => fn());
  }

  // ---------- music ----------
  playMusic(track: MusicTrack) {
    const sameTrackRunning = this.track === track && (this.timer || this.fileAudio);
    this.track = track;
    if (!this.prefs.music || sameTrackRunning) return;
    this.stopSound();

    const file = MUSIC_FILES[track];
    if (file) {
      const el = new Audio(file);
      el.loop = true;
      el.volume = this.ducked ? DUCKED_VOLUME : MUSIC_VOLUME;
      el.play().catch(() => {});
      this.fileAudio = el;
      return;
    }

    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const pattern = TRACKS[track];
    const stepLength = 60 / pattern.bpm / 4;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.timer = setInterval(() => {
      if (!this.ctx) return;
      while (this.nextTime < this.ctx.currentTime + 0.12) {
        this.scheduleStep(pattern, this.nextTime);
        this.nextTime += stepLength;
      }
    }, 25);
  }

  // Stops the music and forgets the track (used when leaving the page).
  stopMusic() {
    this.track = null;
    this.stopSound();
  }

  // Stops the sound but remembers the track (used for mute and when
  // the phone screen goes off), so resumeMusic() can bring it back.
  pauseMusic() {
    this.stopSound();
  }

  resumeMusic() {
    if (this.track) this.playMusic(this.track);
  }

  private stopSound() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.fileAudio) {
      this.fileAudio.pause();
      this.fileAudio = null;
    }
  }

  // Music goes quiet while Mama Titi speaks, then comes back.
  duck() {
    this.ducked = true;
    if (this.fileAudio) this.fileAudio.volume = DUCKED_VOLUME;
    if (this.ctx && this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicBus.gain.setTargetAtTime(DUCKED_VOLUME, this.ctx.currentTime, 0.05);
    }
  }

  unduck() {
    this.ducked = false;
    if (this.fileAudio) this.fileAudio.volume = MUSIC_VOLUME;
    if (this.ctx && this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicBus.gain.setTargetAtTime(MUSIC_VOLUME, this.ctx.currentTime, 0.25);
    }
  }

  // ---------- instruments ----------
  private envelope(g: GainNode, t: number, peak: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }

  private kick(t: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    this.envelope(g, t, 0.9, 0.2);
    o.connect(g).connect(this.musicBus!);
    o.start(t); o.stop(t + 0.22);
  }

  private shaker(t: number, vol: number) {
    const ctx = this.ctx!;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.noise;
    f.type = 'highpass';
    f.frequency.value = 6500;
    this.envelope(g, t, vol, 0.05);
    s.connect(f).connect(g).connect(this.musicBus!);
    s.start(t); s.stop(t + 0.08);
  }

  // Talking drum: the pitch bends down, like the gángan.
  private drum(t: number, f: number, bus: GainNode, vol = 0.55) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 1.25, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.22);
    this.envelope(g, t, vol, 0.25);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + 0.28);
  }

  private note(t: number, f: number, type: OscillatorType, vol: number, decay: number, bus: GainNode) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    this.envelope(g, t, vol, decay);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + decay + 0.02);
  }

  private scheduleStep(p: typeof TRACKS[MusicTrack], t: number) {
    const s = this.step % 16;
    const bar = Math.floor(this.step / 16) % 4;
    if (p.kick.includes(s)) this.kick(t);
    this.shaker(t, s % 4 === 0 ? 0.22 : s % 2 === 0 ? 0.11 : 0.05);
    if (p.drums[s]) this.drum(t, p.drums[s], this.musicBus!);
    if (s % 2 === 0) {
      const n = p.melody[bar][s / 2];
      if (n) this.note(t, n, 'triangle', 0.2, 0.3, this.musicBus!);
    }
    if (s === 0 || s === 8) this.note(t, p.bass[bar], 'triangle', 0.32, 0.38, this.musicBus!);
    this.step++;
  }

  // ---------- sound effects ----------
  sfx(name: SoundEffect) {
    if (!this.prefs.sfx) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running' || !this.sfxBus) return;
    const t = ctx.currentTime, bus = this.sfxBus;
    switch (name) {
      case 'correct':
        this.note(t, 659, 'sine', 0.35, 0.18, bus);
        this.note(t + 0.09, 988, 'sine', 0.35, 0.3, bus);
        break;
      case 'wrong':
        this.note(t, 220, 'triangle', 0.25, 0.22, bus);
        this.note(t + 0.12, 175, 'triangle', 0.25, 0.3, bus);
        break;
      case 'coin':
        this.note(t + 0.15, 1319, 'square', 0.07, 0.08, bus);
        this.note(t + 0.22, 1760, 'square', 0.07, 0.15, bus);
        break;
      case 'tap':
        this.note(t, 520, 'sine', 0.15, 0.06, bus);
        break;
      case 'count':
        this.drum(t, 196, bus, 0.8);
        break;
      case 'go':
        this.drum(t, 262, bus, 0.8);
        this.drum(t + 0.12, 330, bus, 0.8);
        break;
      case 'combo':
        [523, 659, 784].forEach((f, i) => this.note(t + i * 0.06, f, 'sine', 0.25, 0.15, bus));
        break;
      case 'unlock':
        [392, 523, 659, 784].forEach((f, i) => this.note(t + i * 0.08, f, 'triangle', 0.25, 0.2, bus));
        break;
      case 'whoosh':
        this.note(t, 300, 'sine', 0.08, 0.12, bus);
        this.note(t + 0.05, 600, 'sine', 0.08, 0.12, bus);
        break;
      case 'splash': {
        // Candy burst: a quick watery "pssh" plus a bright ping.
        const length = Math.floor(ctx.sampleRate * 0.25);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
        src.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.2);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        src.connect(filter).connect(gain).connect(bus);
        src.start(t);
        src.stop(t + 0.25);
        this.note(t, 880, 'sine', 0.25, 0.12, bus);
        this.note(t + 0.06, 1320, 'sine', 0.2, 0.16, bus);
        break;
      }
      case 'win':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.note(t + i * 0.13, f, 'triangle', 0.3, 0.3, bus));
        break;
    }
  }
}

export const gameAudio = new GameAudio();
