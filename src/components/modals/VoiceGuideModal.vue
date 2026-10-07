<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { kokoroVoice, KOKORO_VOICES, type VoiceGuideSettings, type KokoroVoiceOption } from "@/services/voiceGuide";

const uiStore = useUiStore();

const settings = ref<VoiceGuideSettings>(kokoroVoice.getSettings());
const kokoroVoices = ref<KokoroVoiceOption[]>(KOKORO_VOICES);
const isSpeaking = ref<boolean>(false);
const testText = ref<string>("Hello sovereign creator! Kokoro Voice Heart is active and ready to guide your focus.");

onMounted(() => {
  settings.value = kokoroVoice.getSettings();
});

function updateSettings() {
  kokoroVoice.saveSettings(settings.value);
}

function handleToggleVoice() {
  settings.value.enabled = !settings.value.enabled;
  updateSettings();
  if (settings.value.enabled) {
    kokoroVoice.playHeartChime("affirm");
    speakPreview("Kokoro Voice Heart online. Presence restored.");
    uiStore.showToast("Kokoro Voice Heart enabled ♥");
  } else {
    kokoroVoice.stop();
    uiStore.showToast("Voice guide muted");
  }
}

function playTestChime(type: "affirm" | "listen" | "success" | "notice") {
  kokoroVoice.playHeartChime(type);
}

function speakPreview(textToSpeak?: string) {
  const text = textToSpeak || testText.value;
  isSpeaking.value = true;
  kokoroVoice.speak(text, () => {
    isSpeaking.value = false;
  });
}

function stopSpeaking() {
  kokoroVoice.stop();
  isSpeaking.value = false;
}

function closeModal() {
  uiStore.showVoiceGuideModal = false;
  stopSpeaking();
}
</script>

<template>
  <div v-if="uiStore.showVoiceGuideModal" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-dialog voice-guide-dialog">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="kokoro-heart-avatar" :class="{ pulsing: isSpeaking, active: settings.enabled }">
            <span class="heart-emoji">💖</span>
            <div class="ring-pulse"></div>
          </div>
          <div>
            <div class="title-row">
              <h3 class="modal-title">Kokoro Voice Heart</h3>
              <span class="version-tag">Sovereign Audio Companion</span>
            </div>
            <p class="modal-sub">
              A gentle, calming voice presence that guides your focus, celebrates shipped milestones, and responds to your actions.
            </p>
          </div>
        </div>
        <button type="button" class="btn-close" @click="closeModal">✕</button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Main Toggle Card -->
        <div class="toggle-presence-card" :class="{ enabled: settings.enabled }" @click="handleToggleVoice">
          <div class="presence-left">
            <div class="presence-indicator" :class="{ on: settings.enabled }"></div>
            <div>
              <span class="presence-title">Kokoro Audio Presence</span>
              <p class="presence-desc">
                {{ settings.enabled ? "Active — Providing gentle cues and audio feedback" : "Muted — Zero sound synthesis" }}
              </p>
            </div>
          </div>
          <button type="button" class="presence-switch-btn" :class="{ active: settings.enabled }">
            {{ settings.enabled ? "ENABLED" : "MUTED" }}
          </button>
        </div>

        <!-- Heart Audio Chimes Studio -->
        <div class="settings-card">
          <div class="card-header-row">
            <h4 class="card-heading">Harmonic Heart Chimes (Web Audio API)</h4>
            <span class="offline-tag">100% Zero-Latency Offline</span>
          </div>
          <p class="card-subtext">Procedurally synthesized acoustic frequencies designed to center your cognitive flow.</p>
          <div class="chimes-buttons-grid">
            <button type="button" class="btn-chime" @click="playTestChime('affirm')">
              <span class="chime-icon">✨</span>
              <span class="chime-name">Affirm (Heart Pulse)</span>
            </button>
            <button type="button" class="btn-chime" @click="playTestChime('listen')">
              <span class="chime-icon">🎙️</span>
              <span class="chime-name">Voice Listening</span>
            </button>
            <button type="button" class="btn-chime" @click="playTestChime('success')">
              <span class="chime-icon">💎</span>
              <span class="chime-name">Milestone Shipped</span>
            </button>
            <button type="button" class="btn-chime" @click="playTestChime('notice')">
              <span class="chime-icon">🔔</span>
              <span class="chime-name">Focus Reminder</span>
            </button>
          </div>
        </div>

        <!-- Voice Synthesis Configuration -->
        <div class="settings-card" :class="{ disabled: !settings.enabled }">
          <div class="card-header-row">
            <h4 class="card-heading">Voice Synthesis Tuning</h4>
            <span class="offline-tag">Natural Speech Engine</span>
          </div>

          <!-- Voice Selector -->
          <div class="form-row">
            <label class="form-label">Kokoro Neural Voice:</label>
            <select
              v-model="settings.voiceName"
              class="form-select"
              :disabled="!settings.enabled"
              @change="updateSettings"
            >
              <option
                v-for="v in kokoroVoices"
                :key="v.id"
                :value="v.id"
              >
                {{ v.name }} • [{{ v.accent }} {{ v.gender }}] — {{ v.description }}
              </option>
            </select>
          </div>

          <!-- Rate & Pitch Sliders -->
          <div class="sliders-grid">
            <div class="slider-group">
              <div class="slider-header">
                <span class="slider-label">Speech Rate (Speed)</span>
                <span class="slider-val">{{ settings.rate }}x</span>
              </div>
              <input
                v-model.number="settings.rate"
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                class="range-slider"
                :disabled="!settings.enabled"
                @input="updateSettings"
              />
            </div>

            <div class="slider-group">
              <div class="slider-header">
                <span class="slider-label">Heart Pitch (Warmth)</span>
                <span class="slider-val">{{ settings.pitch }}x</span>
              </div>
              <input
                v-model.number="settings.pitch"
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                class="range-slider"
                :disabled="!settings.enabled"
                @input="updateSettings"
              />
            </div>
          </div>

          <!-- Test Sample Bar -->
          <div class="sample-test-bar">
            <input
              v-model="testText"
              type="text"
              class="sample-text-input"
              placeholder="Type phrase to audition Kokoro voice..."
              :disabled="!settings.enabled"
              @keydown.enter="speakPreview()"
            />
            <button
              v-if="!isSpeaking"
              type="button"
              class="btn-audition"
              :disabled="!settings.enabled"
              @click="speakPreview()"
            >
              ▶ Audition
            </button>
            <button
              v-else
              type="button"
              class="btn-audition stop"
              @click="stopSpeaking"
            >
              ■ Stop
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button type="button" class="btn-done" @click="closeModal">Save &amp; Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(4, 12, 8, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.15s ease-out;
}

.voice-guide-dialog {
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-card, #10291e);
  border-radius: 14px;
  width: 90vw;
  max-width: 680px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px var(--emerald-glow, rgba(16, 185, 129, 0.15));
  overflow: hidden;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle, #0d2319);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kokoro-heart-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #140d12;
  border: 1px solid #3d1c2b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.kokoro-heart-avatar.active {
  border-color: #f43f5e;
  box-shadow: 0 0 15px rgba(244, 63, 94, 0.25);
}

.kokoro-heart-avatar.pulsing .heart-emoji {
  animation: heartThump 0.7s infinite alternate ease-in-out;
}

@keyframes heartThump {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.25);
  }
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary, #fff);
  margin: 0;
}

.version-tag {
  font-size: 10px;
  background: #231219;
  border: 1px solid #4a1f31;
  color: #fb7185;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 700;
}

.modal-sub {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  margin: 3px 0 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-dim, #64748b);
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.btn-close:hover {
  color: var(--text-primary, #fff);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Presence toggle card */
.toggle-presence-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card, #071610);
  border: 1px solid var(--border-card, #10291e);
  padding: 14px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-presence-card.enabled {
  border-color: rgba(244, 63, 94, 0.4);
  background: var(--bg-inner, #0f1013);
}

.presence-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.presence-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text-dim, #64748b);
}

.presence-indicator.on {
  background: #f43f5e;
  box-shadow: 0 0 10px #f43f5e;
}

.presence-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.presence-desc {
  font-size: 11.5px;
  color: var(--text-secondary, #94a3b8);
  margin: 2px 0 0;
}

.presence-switch-btn {
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-card, #10291e);
  color: var(--text-dim, #64748b);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.presence-switch-btn.active {
  background: #3b131e;
  border-color: #f43f5e;
  color: #fda4af;
}

/* Settings card */
.settings-card {
  background: var(--bg-card, #071610);
  border: 1px solid var(--border-subtle, #0d2319);
  padding: 16px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-heading {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #e2e8f0);
  margin: 0;
}

.offline-tag {
  font-size: 10px;
  background: var(--emerald-pill-bg, #092017);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  color: var(--emerald-bright, #34d399);
  padding: 1px 6px;
  border-radius: 6px;
}

.card-subtext {
  font-size: 11.5px;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
}

/* Chimes grid */
.chimes-buttons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.btn-chime {
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-card, #10291e);
  color: var(--text-primary, #fff);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-chime:hover {
  border-color: var(--emerald-main, #10b981);
  background: var(--bg-card-selected, #061912);
}

/* Form row */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #94a3b8);
}

.form-select {
  background: var(--bg-input, #040e0a);
  border: 1px solid var(--border-subtle, #0d2319);
  color: var(--text-primary, #fff);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.sliders-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--text-secondary, #94a3b8);
}

.slider-val {
  color: var(--emerald-bright, #34d399);
  font-weight: 700;
  font-family: var(--font-mono);
}

.range-slider {
  accent-color: var(--emerald-main, #10b981);
  cursor: pointer;
}

/* Audition bar */
.sample-test-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sample-text-input {
  flex: 1;
  background: var(--bg-input, #040e0a);
  border: 1px solid var(--border-subtle, #0d2319);
  color: var(--text-primary, #fff);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.btn-audition {
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  color: #040c08;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-audition.stop {
  background: #ef4444;
  border-color: #f87171;
  color: #fff;
}

/* Footer */
.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle, #0d2319);
  display: flex;
  justify-content: flex-end;
}

.btn-done {
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  color: #040c08;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
