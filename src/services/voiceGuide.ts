/**
 * Kokoro Voice Heart & Sovereign Audio Synthesis Engine
 * 
 * Provides:
 * 1. Warm Kokoro Voice Heart character guidance audio & feedback
 * 2. Web Speech API synthesis with Kokoro-tuned pitch, rate, and soothing inflection
 * 3. Fallback procedural harmonic sound synthesis for zero-cloud offline haptics (Web Audio API)
 */

import { isTauri, tauriSystemTts } from "@/services/tauriIpc";

export interface VoiceGuideSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  voiceName: string;
}

const STORAGE_KEY = "wolf_voice_guide_settings";

class VoiceGuideEngine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private isSpeaking = false;
  private settings: VoiceGuideSettings = {
    enabled: true,
    rate: 1.02,
    pitch: 1.1, // Warm, pleasant heart-like tone
    volume: 0.9,
    voiceName: "default",
  };

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch {}
  }

  public saveSettings(newSettings: Partial<VoiceGuideSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
  }

  public getSettings(): VoiceGuideSettings {
    return { ...this.settings };
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  /**
   * Kokoro Harmonic Heart Chime (Procedural Sound via Web Audio API)
   * Plays a warm dual-tone acoustic chime symbolizing heart presence
   */
  public playHeartChime(type: "affirm" | "listen" | "success" | "notice" = "affirm") {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      if (type === "listen") {
        // Welcoming warm tone
        osc1.frequency.setValueAtTime(440, now); // A4
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.18); // E5
        osc2.frequency.setValueAtTime(554.37, now); // C#5
      } else if (type === "success") {
        // Uplifting triad
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.22); // G5
        osc2.frequency.setValueAtTime(659.25, now);
      } else {
        // Gentle heart pulse
        osc1.frequency.setValueAtTime(329.63, now); // E4
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.15); // A4
        osc2.frequency.setValueAtTime(440, now);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.46);
      osc2.stop(now + 0.46);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  /**
   * Speak guide text with Kokoro Heart presence
   */
  public async speak(text: string, onEnd?: () => void) {
    if (!this.settings.enabled) {
      if (onEnd) onEnd();
      return;
    }

    // 1. If running inside native Linux Tauri desktop app, use system spd-say directly
    if (isTauri()) {
      try {
        this.isSpeaking = true;
        const handled = await tauriSystemTts(text, this.settings.rate, this.settings.pitch);
        this.isSpeaking = false;
        if (handled) {
          if (onEnd) onEnd();
          return;
        }
      } catch (err) {
        console.warn("[Kokoro] Native system TTS fallback to Web Speech:", err);
      }
    }

    // 2. Browser Web Speech API fallback
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;

      // Select best voice (prefer soothing voices like Google US English, Samantha, Karen, or Natural voices)
      const voices = this.getAvailableVoices();
      if (voices.length > 0) {
        if (this.settings.voiceName && this.settings.voiceName !== "default") {
          const matched = voices.find((v) => v.name === this.settings.voiceName);
          if (matched) utterance.voice = matched;
        } else {
          const naturalVoice = voices.find(
            (v) =>
              v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Karen") ||
              v.name.includes("Serena")
          );
          if (naturalVoice) utterance.voice = naturalVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };
      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      if (onEnd) onEnd();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }

  public getSpeakingState() {
    return this.isSpeaking;
  }
}

export const kokoroVoice = new VoiceGuideEngine();
