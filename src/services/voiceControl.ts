/**
 * Sovereign Voice Control Engine
 * Listens for spoken voice commands via the browser's Web Speech Recognition API
 * Dispatches actions (navigation, quick capture, theme toggle, secret lock, search, etc.)
 */

export interface VoiceCommandAction {
  phrase: string;
  description: string;
  action: () => void;
  voiceReply?: string;
}

export interface VoiceControlStatus {
  isListening: boolean;
  isSupported: boolean;
  lastTranscript: string;
  lastAction: string | null;
}

type SpeechRecognitionInstance = any;

class VoiceControlEngine {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private isSupported = false;
  private commands: VoiceCommandAction[] = [];
  private onStatusChangeCallback: ((status: VoiceControlStatus) => void) | null = null;
  private lastTranscript = "";
  private lastAction: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.isSupported = true;
        try {
          this.recognition = new SpeechRecognitionClass();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = "en-US";

          this.recognition.onstart = () => {
            this.isListening = true;
            this.emitStatus();
          };

          this.recognition.onend = () => {
            // Auto restart if intended to be listening
            if (this.isListening) {
              try {
                this.recognition.start();
              } catch {
                this.isListening = false;
                this.emitStatus();
              }
            } else {
              this.emitStatus();
            }
          };

          this.recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const current = (finalTranscript || interimTranscript).trim().toLowerCase();
            if (current) {
              this.lastTranscript = current;
              this.emitStatus();
              if (finalTranscript) {
                this.matchAndExecute(finalTranscript.trim().toLowerCase());
              }
            }
          };

          this.recognition.onerror = (event: any) => {
            console.warn("[Voice Control] Recognition error:", event.error);
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              this.isListening = false;
              this.emitStatus();
            }
          };
        } catch (e) {
          console.warn("Failed to initialize SpeechRecognition:", e);
          this.isSupported = false;
        }
      }
    }
  }

  public registerCommands(commands: VoiceCommandAction[]) {
    this.commands = commands;
  }

  public onStatusChange(callback: (status: VoiceControlStatus) => void) {
    this.onStatusChangeCallback = callback;
    this.emitStatus();
  }

  private emitStatus() {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback({
        isListening: this.isListening,
        isSupported: this.isSupported,
        lastTranscript: this.lastTranscript,
        lastAction: this.lastAction,
      });
    }
  }

  public startListening() {
    if (!this.isSupported || !this.recognition) return false;
    this.isListening = true;
    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.emitStatus();
  }

  public toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      return this.startListening();
    }
  }

  public getStatus(): VoiceControlStatus {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported,
      lastTranscript: this.lastTranscript,
      lastAction: this.lastAction,
    };
  }

  public matchAndExecute(phrase: string): boolean {
    for (const cmd of this.commands) {
      const match = phrase.includes(cmd.phrase.toLowerCase());
      if (match) {
        this.lastAction = cmd.description;
        cmd.action();
        this.emitStatus();
        return true;
      }
    }
    return false;
  }
}

export const voiceControl = new VoiceControlEngine();
