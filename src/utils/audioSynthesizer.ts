// Web Audio API Synthesizer for infant cries & calming baby sounds
// Runs client-side in all modern browsers without needing external assets

class AudioEngine {
  private ctx: AudioContext | null = null;
  private activeSoothingNodes: { [key: string]: { stop: () => void } } = {};
  private activeCryTimeout: number | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- 1. SIMULATE CLINICAL INFANT CRY SOUNDS ---
  public playInfantCry(
    type: 'hunger_cry' | 'colic_screech' | 'tired_whine' | 'diaper_fuss' | 'burp_grunt',
    durationSeconds = 4.5,
    onEnded?: () => void
  ): () => void {
    const ctx = this.getContext();
    this.stopInfantCry();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;
    const stopFns: (() => void)[] = [];

    if (type === 'hunger_cry') {
      // Rhythmic rising & falling cry with suction formant
      const cycleDuration = 1.2;
      const cycles = Math.ceil(durationSeconds / cycleDuration);

      for (let i = 0; i < cycles; i++) {
        const cycleStart = now + i * cycleDuration;
        const osc = ctx.createOscillator();
        const formant = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // Base pitch rises then falls slightly
        osc.frequency.setValueAtTime(410, cycleStart);
        osc.frequency.linearRampToValueAtTime(460, cycleStart + 0.4);
        osc.frequency.linearRampToValueAtTime(390, cycleStart + 0.9);

        // Formant filter (mouth shape: "Neh" nasal/palatal)
        formant.type = 'bandpass';
        formant.frequency.setValueAtTime(1400, cycleStart);
        formant.Q.setValueAtTime(3.5, cycleStart);

        // Amplitude envelope: swelling cry with breath pause
        gain.gain.setValueAtTime(0.001, cycleStart);
        gain.gain.exponentialRampToValueAtTime(0.5, cycleStart + 0.2);
        gain.gain.linearRampToValueAtTime(0.4, cycleStart + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, cycleStart + 0.95);

        osc.connect(formant);
        formant.connect(gain);
        gain.connect(masterGain);

        osc.start(cycleStart);
        osc.stop(cycleStart + 1.0);
        stopFns.push(() => {
          try {
            osc.stop();
          } catch {}
        });
      }
    } else if (type === 'colic_screech') {
      // High-pitched intense cry with strain vibrato
      const osc = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.linearRampToValueAtTime(630, now + 1.5);
      osc.frequency.linearRampToValueAtTime(560, now + 3.0);

      // Tremolo / high-tension vibrato
      vibrato.frequency.setValueAtTime(7.5, now);
      vibGain.gain.setValueAtTime(35, now);
      vibrato.connect(osc.frequency);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.65, now + 0.1);
      gain.gain.setValueAtTime(0.6, now + durationSeconds - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      vibrato.start(now);
      osc.start(now);
      vibrato.stop(now + durationSeconds);
      osc.stop(now + durationSeconds);
      stopFns.push(() => {
        try {
          osc.stop();
          vibrato.stop();
        } catch {}
      });
    } else if (type === 'tired_whine') {
      // Slurred downward whine with yawning resonance ("Owh")
      const cycleDuration = 1.8;
      const cycles = Math.ceil(durationSeconds / cycleDuration);

      for (let i = 0; i < cycles; i++) {
        const cycleStart = now + i * cycleDuration;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(430, cycleStart);
        osc.frequency.exponentialRampToValueAtTime(340, cycleStart + 1.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, cycleStart);

        gain.gain.setValueAtTime(0.01, cycleStart);
        gain.gain.linearRampToValueAtTime(0.4, cycleStart + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, cycleStart + 1.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(cycleStart);
        osc.stop(cycleStart + 1.5);
        stopFns.push(() => {
          try {
            osc.stop();
          } catch {}
        });
      }
    } else if (type === 'burp_grunt') {
      // Abrupt guttural grunts from upper chest ("Eh")
      const burstCount = 4;
      for (let i = 0; i < burstCount; i++) {
        const bStart = now + i * 0.85;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(310, bStart);
        osc.frequency.linearRampToValueAtTime(280, bStart + 0.25);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750, bStart);
        filter.Q.setValueAtTime(3.0, bStart);

        gain.gain.setValueAtTime(0.01, bStart);
        gain.gain.linearRampToValueAtTime(0.5, bStart + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, bStart + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(bStart);
        osc.stop(bStart + 0.35);
        stopFns.push(() => {
          try {
            osc.stop();
          } catch {}
        });
      }
    } else {
      // Diaper / Discomfort ("Heh") - whiny, irritated, breathy
      const cycleDuration = 1.0;
      const cycles = Math.ceil(durationSeconds / cycleDuration);

      for (let i = 0; i < cycles; i++) {
        const cycleStart = now + i * cycleDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(390, cycleStart);
        osc.frequency.linearRampToValueAtTime(420, cycleStart + 0.2);
        osc.frequency.linearRampToValueAtTime(380, cycleStart + 0.5);

        gain.gain.setValueAtTime(0.01, cycleStart);
        gain.gain.linearRampToValueAtTime(0.35, cycleStart + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, cycleStart + 0.6);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(cycleStart);
        osc.stop(cycleStart + 0.7);
        stopFns.push(() => {
          try {
            osc.stop();
          } catch {}
        });
      }
    }

    this.activeCryTimeout = window.setTimeout(() => {
      if (onEnded) onEnded();
    }, durationSeconds * 1000);

    return () => {
      stopFns.forEach(fn => fn());
      if (this.activeCryTimeout) {
        clearTimeout(this.activeCryTimeout);
        this.activeCryTimeout = null;
      }
    };
  }

  public stopInfantCry(): void {
    if (this.activeCryTimeout) {
      clearTimeout(this.activeCryTimeout);
      this.activeCryTimeout = null;
    }
  }

  // --- 2. SOOTHING SOUND SUITE (Continuous loops) ---
  public playSoothingTrack(
    trackId: 'white_noise' | 'womb_heartbeat' | 'gentle_rain' | 'shushing' | 'lullaby',
    volume = 0.5
  ): void {
    const ctx = this.getContext();
    this.stopSoothingTrack(trackId);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (trackId === 'white_noise') {
      // Gentle nursery filtered white noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter off harsh high frequencies for infant ears (gentle warm curve)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();

      this.activeSoothingNodes[trackId] = {
        stop: () => {
          try {
            whiteNoise.stop();
          } catch {}
        },
      };
    } else if (trackId === 'womb_heartbeat') {
      // 72 BPM rhythmic maternal pulse (lub-dub)
      let isPlaying = true;
      const interval = setInterval(() => {
        if (!isPlaying) return;
        const now = ctx.currentTime;

        // Lub (First beat)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(60, now);
        osc1.frequency.exponentialRampToValueAtTime(35, now + 0.15);
        gain1.gain.setValueAtTime(0.8, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // Dub (Second beat, 180ms later)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(50, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(30, now + 0.32);
        gain2.gain.setValueAtTime(0.65, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.38);
      }, 833); // 72 bpm

      this.activeSoothingNodes[trackId] = {
        stop: () => {
          isPlaying = false;
          clearInterval(interval);
        },
      };
    } else if (trackId === 'gentle_rain') {
      // Rain texture: pink noise with light high-pass & low-pass
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.2;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1200, ctx.currentTime);

      source.connect(lowpass);
      lowpass.connect(masterGain);
      source.start();

      this.activeSoothingNodes[trackId] = {
        stop: () => {
          try {
            source.stop();
          } catch {}
        },
      };
    } else if (trackId === 'shushing') {
      // Rhythmic human "Shhhhh" sound
      let isPlaying = true;
      const interval = setInterval(() => {
        if (!isPlaying) return;
        const now = ctx.currentTime;
        const bufferSize = Math.floor(ctx.sampleRate * 1.5);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.setValueAtTime(2500, now);
        band.Q.setValueAtTime(1.8, now);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.01, now);
        env.gain.linearRampToValueAtTime(0.7, now + 0.3);
        env.gain.exponentialRampToValueAtTime(0.01, now + 1.3);

        source.connect(band);
        band.connect(env);
        env.connect(masterGain);

        source.start(now);
        source.stop(now + 1.4);
      }, 1800);

      this.activeSoothingNodes[trackId] = {
        stop: () => {
          isPlaying = false;
          clearInterval(interval);
        },
      };
    } else if (trackId === 'lullaby') {
      // Music box bell chimes (Brahm's Lullaby tones)
      const notes = [261.63, 261.63, 293.66, 261.63, 349.23, 329.63, 261.63, 261.63, 293.66, 261.63, 392.00, 349.23];
      const durations = [0.8, 0.4, 0.8, 0.8, 1.2, 1.2, 0.8, 0.4, 0.8, 0.8, 1.2, 1.5];
      let noteIndex = 0;
      let isPlaying = true;

      const playNextNote = () => {
        if (!isPlaying) return;
        const now = ctx.currentTime;
        const freq = notes[noteIndex];
        const dur = durations[noteIndex];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Music box metallic harmonic ping
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + dur + 0.1);

        noteIndex = (noteIndex + 1) % notes.length;
        setTimeout(playNextNote, dur * 900);
      };

      playNextNote();

      this.activeSoothingNodes[trackId] = {
        stop: () => {
          isPlaying = false;
        },
      };
    }
  }

  public stopSoothingTrack(trackId: string): void {
    if (this.activeSoothingNodes[trackId]) {
      this.activeSoothingNodes[trackId].stop();
      delete this.activeSoothingNodes[trackId];
    }
  }

  public stopAllSoothing(): void {
    Object.keys(this.activeSoothingNodes).forEach(k => {
      this.stopSoothingTrack(k);
    });
  }
}

export const audioSynthesizer = new AudioEngine();
