// Real-time Audio Stream Analyzer & Autocorrelation Pitch Detector
// Supports real microphone hardware as well as simulated live acoustic stream fallback

export class LiveAudioAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private animationFrameId: number | null = null;
  private isSimulating = false;
  private simulationInterval: number | null = null;

  public async startListening(
    onMetricsUpdate: (metrics: { freq: number; decibels: number; isVoice: boolean }) => void,
    canvasRef?: HTMLCanvasElement | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.stopListening();

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          success: false,
          error: 'المتصفح الحالي لا يدعم الوصول المباشر للميكروفون.',
        };
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      // Setup recorder for sending audio to API
      this.recordedChunks = [];
      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
        this.mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };
        this.mediaRecorder.start(250);
      } catch (recErr) {
        // MediaRecorder failure is non-fatal
      }

      const bufferLength = this.analyser.fftSize;
      const timeData = new Float32Array(bufferLength);
      const freqData = new Uint8Array(this.analyser.frequencyBinCount);

      const loop = () => {
        if (!this.analyser || !this.audioCtx) return;

        this.analyser.getFloatTimeDomainData(timeData);
        this.analyser.getByteFrequencyData(freqData);

        // 1. Calculate RMS / Decibels
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          sumSquares += timeData[i] * timeData[i];
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const decibels = Math.max(30, Math.min(100, Math.round(20 * Math.log10(Math.max(1e-5, rms)) + 90)));

        // 2. Pitch Detection via Auto-correlation
        const detectedPitch = this.autoCorrelate(timeData, this.audioCtx.sampleRate);
        const isVoice = rms > 0.02 && detectedPitch > 250 && detectedPitch < 900;

        onMetricsUpdate({
          freq: Math.round(detectedPitch > 0 ? detectedPitch : 420),
          decibels,
          isVoice,
        });

        // 3. Render Canvas Visualizer if canvas provided
        if (canvasRef) {
          this.drawVisualizer(canvasRef, timeData, freqData);
        }

        this.animationFrameId = requestAnimationFrame(loop);
      };

      loop();
      return { success: true };
    } catch (err: any) {
      const errName = err?.name || '';
      let errorMsg = 'تعذر الوصول إلى الميكروفون.';
      if (errName === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        errorMsg = 'تم رفض إذن الميكروفون في المتصفح.';
      } else if (errName === 'NotFoundError') {
        errorMsg = 'لم يتم العثور على ميكروفون متصل بالجهاز.';
      }

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  // Live Simulated Stream (used when microphone is denied or running in sandboxed environment)
  public startSimulatedListening(
    onMetricsUpdate: (metrics: { freq: number; decibels: number; isVoice: boolean }) => void,
    canvasRef?: HTMLCanvasElement | null,
    baseFreq = 435
  ) {
    this.stopListening();
    this.isSimulating = true;

    let tick = 0;
    const bufferLength = 1024;
    const timeData = new Float32Array(bufferLength);
    const freqData = new Uint8Array(bufferLength / 2);

    const loop = () => {
      if (!this.isSimulating) return;
      tick += 0.08;

      // Realistic breathing and cry pulse cadence
      const pulse = Math.sin(tick * 1.5);
      const isBurst = pulse > -0.2;
      const decibels = isBurst ? Math.round(68 + Math.sin(tick * 3) * 12) : 38;
      const freq = isBurst ? Math.round(baseFreq + Math.sin(tick * 2) * 35) : 320;

      onMetricsUpdate({
        freq,
        decibels,
        isVoice: isBurst,
      });

      // Generate synthetic waveform
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 18 + tick * 4;
        timeData[i] = isBurst ? Math.sin(angle) * 0.45 + (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.05;
      }
      for (let i = 0; i < freqData.length; i++) {
        freqData[i] = isBurst ? Math.min(255, Math.floor(Math.sin(i * 0.1 + tick) * 100 + 120)) : 15;
      }

      if (canvasRef) {
        this.drawVisualizer(canvasRef, timeData, freqData);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  public async stopListening(): Promise<{ audioBlob: Blob | null; base64: string | null }> {
    this.isSimulating = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    let audioBlob: Blob | null = null;
    let base64: string | null = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        await new Promise<void>(resolve => {
          if (!this.mediaRecorder) return resolve();
          this.mediaRecorder.onstop = () => resolve();
          this.mediaRecorder.stop();
        });

        if (this.recordedChunks.length > 0) {
          audioBlob = new Blob(this.recordedChunks, {
            type: this.recordedChunks[0].type || 'audio/webm',
          });
          base64 = await this.blobToBase64(audioBlob);
        }
      } catch (e) {
        // Safe ignore
      }
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.analyser = null;
    return { audioBlob, base64 };
  }

  // Draw smooth acoustic waveform and spectral glowing frequency lines
  private drawVisualizer(
    canvas: HTMLCanvasElement,
    timeData: Float32Array,
    freqData: Uint8Array
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw spectrum gradient bars in the background
    const barWidth = (width / freqData.length) * 4;
    for (let i = 0; i < freqData.length / 4; i++) {
      const barHeight = (freqData[i] / 255) * (height * 0.7);
      const x = i * barWidth;
      const y = height - barHeight;

      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.4)');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    // Draw primary cry waveform curve
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#6366F1';
    ctx.beginPath();

    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] * 0.9;
      const y = (height / 2) + v * (height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
  }

  // Autocorrelation algorithm for reliable infant pitch tracking (250Hz - 900Hz)
  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmedBuf = buf.slice(r1, r2);
    const c = new Float32Array(trimmedBuf.length).fill(0);

    for (let i = 0; i < trimmedBuf.length; i++) {
      for (let j = 0; j < trimmedBuf.length - i; j++) {
        c[i] = c[i] + trimmedBuf[j] * trimmedBuf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < trimmedBuf.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 === 0) return -1;

    const freq = sampleRate / T0;
    if (freq >= 250 && freq <= 950) {
      return freq;
    }
    return -1;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64Data = res.split(',')[1] || '';
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const liveAudioAnalyzer = new LiveAudioAnalyzer();
