<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useLicenseStore } from "@/stores/useLicenseStore";
import type { LicenseTier } from "@/types";

const uiStore = useUiStore();
const licenseStore = useLicenseStore();

const isDev = import.meta.env.DEV;

function continueToApp() {
  uiStore.showLicenseModal = false;
  uiStore.showToast("Welcome to Wolf Timeline! Enjoy sovereign building 🐺");
}

async function selectFreeTier() {
  await licenseStore.selectFreeSoloTier();
  uiStore.showToast("Solo Personal Node activated (Free forever) ✓");
  uiStore.showLicenseModal = false;
}

const activeTab = ref<"activation" | "keygen">("activation");

// Activation state
const keyInput = ref("");
const errorMessage = ref("");
const isCopied = ref(false);

// Keygen state
const keygenDeviceId = ref("");
const keygenTier = ref<LicenseTier>("commercial_solo");
const keygenOrg = ref("Sovereign Studio Inc");
const generatedSerial = ref("");
const generatedMessage = ref("");
const isSerialCopied = ref(false);
const isMessageCopied = ref(false);

onMounted(() => {
  keygenDeviceId.value = licenseStore.deviceId;
});

function copyDeviceId() {
  navigator.clipboard.writeText(licenseStore.deviceId);
  isCopied.value = true;
  setTimeout(() => (isCopied.value = false), 2000);
}

async function handleGenerateKey() {
  const targetId = keygenDeviceId.value.trim() || licenseStore.deviceId;
  const result = await licenseStore.generateKeyForDevice(targetId, keygenTier.value, keygenOrg.value);
  generatedSerial.value = result.key;
  generatedMessage.value = result.message;
  uiStore.showToast(`Cryptographic serial generated for ${result.tierLabel} ✓`);
}

function copySerialOnly() {
  if (!generatedSerial.value) return;
  navigator.clipboard.writeText(generatedSerial.value);
  isSerialCopied.value = true;
  uiStore.showToast("Serial key copied to clipboard ✓");
  setTimeout(() => (isSerialCopied.value = false), 2000);
}

function copyFullMessage() {
  if (!generatedMessage.value) return;
  navigator.clipboard.writeText(generatedMessage.value);
  isMessageCopied.value = true;
  uiStore.showToast("Formatted activation instructions copied ✓");
  setTimeout(() => (isMessageCopied.value = false), 2000);
}

async function handleAutoActivateCurrentHardware(tierType: LicenseTier = "commercial_solo") {
  const res = await licenseStore.autoActivateHardware(tierType);
  if (res.success) {
    uiStore.showToast(`Node activated as ${tierType.replace('_', ' ').toUpperCase()} ✓`);
    keyInput.value = res.key;
  } else {
    uiStore.showToast("Activation failed.");
  }
}

function pasteMasterFounderKey() {
  keyInput.value = licenseStore.MASTER_FOUNDER_KEY;
  uiStore.showToast("Founder Sovereign VIP Key loaded ✓");
}

async function handleActivate() {
  if (!keyInput.value.trim()) {
    errorMessage.value = "Please enter your license key.";
    return;
  }

  errorMessage.value = "";
  const res = await licenseStore.activate(keyInput.value);
  if (res.success) {
    uiStore.showLicenseModal = false;
    uiStore.showToast(`Sovereign Node successfully activated! (${licenseStore.tierLabel}) 🐺`);
  } else {
    errorMessage.value = res.error || "Activation failed. Please check key.";
  }
}

async function handleDeactivate() {
  if (confirm("Reset to Free Solo Personal mode on this device?")) {
    await licenseStore.deactivate();
    uiStore.showToast("Reverted to Free Solo Personal Node.");
  }
}
</script>

<template>
  <div v-if="uiStore.showLicenseModal" class="modal-overlay" @click.self="uiStore.showLicenseModal = false">
    <div class="modal-window">
      <!-- Modal Header -->
      <div class="modal-header-centered">
        <div class="modal-brand">
          <img src="/assets/wolf-logo.png" alt="Wolf Logo" class="modal-wolf-logo" />
          <span class="modal-brand-text">WOLF TIMELINE LICENSING</span>
        </div>
        <h2 class="modal-title">
          {{ licenseStore.isTeam ? '👥 Sovereign Pack Node (Team)' : licenseStore.isCommercialSolo ? '⚡ Commercial Solo Node' : '🐺 Solo Personal Workspace' }}
        </h2>
        <p class="modal-subtitle">
          Free for solo personal builders &amp; hobbyists. Commercial and team seats require a verifiable offline license key.
        </p>

        <!-- Mode Switcher Tabs (Dev Only: hidden in production) -->
        <div v-if="isDev" class="modal-nav-tabs">
          <button
            type="button"
            class="modal-tab-btn"
            :class="{ active: activeTab === 'activation' }"
            @click="activeTab = 'activation'"
          >
            🔑 License &amp; Tiers
          </button>
          <button
            type="button"
            class="modal-tab-btn keygen-tab"
            :class="{ active: activeTab === 'keygen' }"
            @click="activeTab = 'keygen'; handleGenerateKey();"
          >
            ⚡ Keygen Studio (Dev Tool)
          </button>
        </div>
      </div>

      <div class="license-body">
        <!-- TAB 1: 3-TIER OVERVIEW & ACTIVATION -->
        <template v-if="activeTab === 'activation'">
          <!-- Tier Overview Cards 3-Column Layout -->
          <div class="tier-comparison-box three-col">
            <!-- Tier 1: Free Solo Personal -->
            <div class="tier-card community" :class="{ current: licenseStore.isFree }">
              <div class="tier-card-head">
                <div class="tier-badge-line">
                  <span class="tier-status-pill green">100% FREE</span>
                  <span v-if="licenseStore.isFree" class="tier-current-tag">ACTIVE</span>
                </div>
                <span class="tier-name">Solo Personal</span>
                <span class="tier-price">$0 <span>forever</span></span>
              </div>
              <ul class="tier-features">
                <li>✓ Personal projects &amp; learning</li>
                <li>✓ Full offline AES-256 SQLite vault</li>
                <li>✓ Studio focus &amp; deep spec editor</li>
                <li>✓ Standard JSON/MD export</li>
                <li class="disabled-feature">✗ Commercial client projects</li>
                <li class="disabled-feature">✗ Unbranded white-label exports</li>
              </ul>
              <button
                type="button"
                class="btn-tier-action free-tier-btn"
                :class="{ active: licenseStore.isFree }"
                @click="selectFreeTier"
              >
                {{ licenseStore.isFree ? "Current Active Tier" : "Switch to Free Solo" }}
              </button>
            </div>

            <!-- Tier 2: Commercial Solo -->
            <div class="tier-card commercial" :class="{ current: licenseStore.isCommercialSolo }">
              <div class="tier-card-head">
                <div class="tier-badge-line">
                  <span class="tier-status-pill cyan">SOLO PRO</span>
                  <span v-if="licenseStore.isCommercialSolo" class="tier-current-tag">ACTIVE</span>
                </div>
                <span class="tier-name">Commercial Solo</span>
                <span class="tier-price">$49 <span>lifetime or $9/mo</span></span>
              </div>
              <ul class="tier-features">
                <li>★ <strong>Full Commercial &amp; Client Rights</strong></li>
                <li>★ Unbranded white-label exports</li>
                <li>★ Priority AI Decision Studio ADRs</li>
                <li>★ Cryptographic Proof-of-License</li>
                <li class="disabled-feature">✗ Multi-seat team sync</li>
              </ul>
              <button
                type="button"
                class="btn-tier-action commercial-btn"
                :class="{ active: licenseStore.isCommercialSolo }"
                @click="handleAutoActivateCurrentHardware('commercial_solo')"
              >
                {{ licenseStore.isCommercialSolo ? "✓ Active Commercial" : "Activate Commercial ($49)" }}
              </button>
            </div>

            <!-- Tier 3: Team / Pack Node -->
            <div class="tier-card team" :class="{ current: licenseStore.isTeam }">
              <div class="tier-card-head">
                <div class="tier-badge-line">
                  <span class="tier-status-pill gold">MULTI-SEAT</span>
                  <span v-if="licenseStore.isTeam" class="tier-current-tag">ACTIVE</span>
                </div>
                <span class="tier-name">Team / Pack Node</span>
                <span class="tier-price">$19 <span>/seat/month</span></span>
              </div>
              <ul class="tier-features">
                <li>★ <strong>5 to 25 Seat Mesh Licenses</strong></li>
                <li>★ Shared Team Secret Locker</li>
                <li>★ Git-backed repo auto-sync</li>
                <li>★ Multi-author attribution &amp; ADRs</li>
                <li>★ Priority Council of Experts audit</li>
              </ul>
              <button
                type="button"
                class="btn-tier-action team-btn"
                :class="{ active: licenseStore.isTeam }"
                @click="handleAutoActivateCurrentHardware('team')"
              >
                {{ licenseStore.isTeam ? "✓ Active Team Mesh" : "Activate Team Seat ($19)" }}
              </button>
            </div>
          </div>

          <!-- Device ID Card -->
          <div class="device-card">
            <div class="device-label-row">
              <span class="device-label">Your Machine Hardware Fingerprint</span>
              <span class="device-badge">Hardware Bound</span>
            </div>
            <div class="device-val-row">
              <code class="device-id-code">{{ licenseStore.deviceId }}</code>
              <button type="button" class="btn-copy-device" @click="copyDeviceId">
                {{ isCopied ? "Copied ✓" : "Copy ID" }}
              </button>
            </div>
            <p class="device-hint">
              Drop this Device ID in replies on X or pass to your team admin to receive your cryptographically bound key.
            </p>
          </div>

          <!-- Status Card if Activated with Paid Key -->
          <div v-if="licenseStore.isPaid" class="activated-card">
            <div class="act-header">
              <span class="act-dot" :class="{ 'team-dot': licenseStore.isTeam }"></span>
              <span class="act-title">Active License: {{ licenseStore.tierLabel }}</span>
            </div>
            <div class="act-details">
              <span class="act-key">Key: {{ licenseStore.licenseKey }}</span>
              <span v-if="licenseStore.seats > 1" class="act-seats">Seats Allocated: {{ licenseStore.seats }}</span>
            </div>
            <div class="act-actions-row">
              <button type="button" class="btn-continue-alpha" @click="continueToApp">
                Open Workspace →
              </button>
              <button type="button" class="btn-deactivate" @click="handleDeactivate">
                Revert to Free Solo
              </button>
            </div>
          </div>

          <!-- Key Input Form if not paid or wishing to upgrade -->
          <form v-else class="key-form" @submit.prevent="handleActivate">
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label">Have a Commercial or Team Key?</label>
                <button v-if="isDev" type="button" class="btn-link-action" @click="pasteMasterFounderKey">
                  Use Master Founder Key (Dev)
                </button>
              </div>
              <div class="key-input-row">
                <input
                  v-model="keyInput"
                  type="text"
                  class="form-input mono"
                  placeholder="WOLF-COMM-XXXX-XXXX-XXXX or WOLF-TEAM-..."
                />
                <button type="submit" class="btn-activate" :disabled="!keyInput.trim()">
                  Activate Key
                </button>
              </div>
            </div>

            <div v-if="errorMessage" class="license-error">
              {{ errorMessage }}
            </div>

            <!-- Primary Action: Frictionless Continue Button -->
            <div class="onboarding-actions">
              <button type="button" class="btn-continue-alpha" @click="continueToApp">
                <span>Enter Workspace as Free Solo Personal Node →</span>
              </button>
            </div>
          </form>
        </template>

        <!-- TAB 2: HARDWARE KEYGEN STUDIO (DEV / ADMIN) -->
        <template v-else-if="activeTab === 'keygen'">
          <div class="keygen-studio-panel">
            <div class="keygen-header-row">
              <span class="keygen-title">Cryptographic Key Generator</span>
              <span class="keygen-badge">SHA-256 HMAC Multi-Tier Engine</span>
            </div>

            <div class="keygen-field-group">
              <label class="keygen-label">Target Hardware Device ID</label>
              <div class="keygen-input-row">
                <input
                  v-model="keygenDeviceId"
                  type="text"
                  class="keygen-input mono"
                  placeholder="WOLF-DEV-XXXX-XXXX-XXXX"
                />
                <button
                  type="button"
                  class="btn-keygen-reset"
                  @click="keygenDeviceId = licenseStore.deviceId"
                  title="Use Current Hardware"
                >
                  My Device
                </button>
              </div>
            </div>

            <div class="keygen-field-group">
              <label class="keygen-label">License Tier Allocation</label>
              <select v-model="keygenTier" class="keygen-select">
                <option value="solo_free">Solo Personal Node (Free)</option>
                <option value="commercial_solo">Commercial Solo License ($49 Lifetime)</option>
                <option value="team">Team / Pack Mesh License ($19/seat/mo • 5 Seats)</option>
              </select>
            </div>

            <div v-if="keygenTier === 'team'" class="keygen-field-group">
              <label class="keygen-label">Organization Name</label>
              <input
                v-model="keygenOrg"
                type="text"
                class="keygen-input"
                placeholder="Company or Studio Name"
              />
            </div>

            <button type="button" class="btn-run-keygen" @click="handleGenerateKey">
              ⚡ Generate Cryptographic Serial Key
            </button>

            <!-- Generated Output Card -->
            <div v-if="generatedSerial" class="keygen-output-card">
              <div class="output-row">
                <span class="output-label">GENERATED SERIAL:</span>
                <code class="output-serial">{{ generatedSerial }}</code>
              </div>

              <div class="output-actions">
                <button type="button" class="btn-output-action" @click="copySerialOnly">
                  {{ isSerialCopied ? "Copied ✓" : "📋 Copy Serial" }}
                </button>
                <button type="button" class="btn-output-action highlight" @click="handleAutoActivateCurrentHardware(keygenTier)">
                  ⚡ 1-Click Activate This Node
                </button>
                <button type="button" class="btn-output-action" @click="copyFullMessage">
                  {{ isMessageCopied ? "Copied ✓" : "💬 Copy Instructions" }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <button type="button" class="btn-corner-close" @click="uiStore.showLicenseModal = false">✕</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 6, 0.88);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-window {
  position: relative;
  width: 760px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  background: #06140f;
  border: 1px solid #10b98144;
  border-radius: 18px;
  padding: 26px 30px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(16, 185, 129, 0.12);
}

.modal-header-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 16px;
}

.modal-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.modal-wolf-logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.modal-brand-text {
  font-size: 11px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.1em;
}

.modal-title {
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.modal-subtitle {
  font-size: 11.5px;
  color: #9ca3af;
  line-height: 1.4;
}

/* Tab Switcher */
.modal-nav-tabs {
  display: flex;
  align-items: center;
  background: #040e0a;
  border: 1px solid #0f271d;
  border-radius: 8px;
  padding: 3px;
  margin-top: 14px;
  width: 100%;
}

.modal-tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.modal-tab-btn.active {
  background: #10b981;
  color: #03140b;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.license-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.device-card {
  background: #040e0a;
  border: 1px solid #0f271d;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
}

.device-badge {
  font-size: 9.5px;
  font-weight: 800;
  background: #092017;
  color: var(--emerald-bright, #34d399);
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid #143d2a;
}

.device-val-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.device-id-code {
  font-family: var(--font-mono, monospace);
  font-size: 13.5px;
  font-weight: 700;
  color: #a7f3d0;
  letter-spacing: 0.05em;
}

.btn-copy-device {
  background: #092017;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  padding: 4px 10px;
  color: var(--emerald-bright, #34d399);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-device:hover {
  background: #10b981;
  color: #03140b;
}

.device-hint {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.activated-card {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.act-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.act-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.act-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.act-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11.5px;
  color: #9ca3af;
}

.btn-deactivate {
  align-self: flex-start;
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}

.btn-deactivate:hover {
  background: rgba(239, 68, 68, 0.1);
}

.key-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #9ca3af;
}

.btn-link-action {
  background: transparent;
  border: none;
  color: #34d399;
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
}

.form-input.mono {
  background: #040e0a;
  border: 1px solid #0f271d;
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  outline: none;
}

.form-input.mono:focus {
  border-color: var(--emerald-bright, #34d399);
}

.key-input-row {
  display: flex;
  gap: 8px;
}

.key-input-row .form-input {
  flex: 1;
}

.tier-comparison-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tier-comparison-box.three-col {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 680px) {
  .tier-comparison-box.three-col {
    grid-template-columns: 1fr;
  }
}

.tier-card {
  background: #040e0a;
  border: 1px solid #0f271d;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  transition: all 0.2s ease;
}

.tier-card.current {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.05);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.08);
}

.tier-card.commercial.current {
  border-color: rgba(6, 182, 212, 0.5);
  background: rgba(6, 182, 212, 0.05);
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.1);
}

.tier-card.team.current {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.05);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.1);
}

.tier-card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tier-badge-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.tier-current-tag {
  font-size: 8.5px;
  font-weight: 800;
  background: #10b981;
  color: #03140b;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.tier-status-pill {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.tier-status-pill.green {
  color: #34d399;
}

.tier-status-pill.cyan {
  color: #06b6d4;
}

.tier-status-pill.gold {
  color: #fbbf24;
}

.tier-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #ffffff;
}

.tier-price {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}

.tier-price span {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
}

.tier-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.tier-features li {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.35;
}

.tier-features li.disabled-feature {
  color: #4b5563;
  text-decoration: line-through;
  opacity: 0.7;
}

.btn-tier-action {
  width: 100%;
  border: none;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 6px;
}

.free-tier-btn {
  background: #092017;
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.free-tier-btn:hover, .free-tier-btn.active {
  background: #10b981;
  color: #03140b;
}

.commercial-btn {
  background: #062028;
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.commercial-btn:hover, .commercial-btn.active {
  background: #06b6d4;
  color: #021a22;
}

.team-btn {
  background: #251605;
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.team-btn:hover, .team-btn.active {
  background: #f59e0b;
  color: #1a0f02;
}

.act-dot.team-dot {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.act-actions-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.onboarding-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.btn-continue-alpha {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #03140b;
  font-size: 13px;
  font-weight: 800;
  padding: 12px 18px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

.btn-continue-alpha:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-auto-unlock {
  background: #092017;
  border: 1px solid #143d2a;
  color: #34d399;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-auto-unlock.dev-only {
  font-size: 11px;
  padding: 6px 12px;
  opacity: 0.7;
}

.btn-auto-unlock.dev-only:hover {
  opacity: 1;
}

.btn-activate {
  background: #10b981;
  color: #03100a;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-activate:hover:not(:disabled) {
  background: #34d399;
}

.btn-activate:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.license-error {
  font-size: 11.5px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
}

/* Keygen Studio Styling */
.keygen-studio-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keygen-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.keygen-title {
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
}

.keygen-badge {
  font-size: 10px;
  font-weight: 700;
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 2px 7px;
  border-radius: 6px;
}

.keygen-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.keygen-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.keygen-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.keygen-input,
.keygen-select {
  flex: 1;
  background: #040e0a;
  border: 1px solid #0f271d;
  border-radius: 6px;
  padding: 8px 10px;
  color: #ffffff;
  font-size: 12px;
  outline: none;
}

.keygen-input.mono {
  font-family: var(--font-mono, monospace);
  font-size: 12.5px;
  color: #a7f3d0;
}

.btn-keygen-reset {
  background: #092017;
  border: 1px solid #143d2a;
  color: #34d399;
  font-size: 11px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-run-keygen {
  background: #10b981;
  color: #03140b;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 4px;
}

.btn-run-keygen:hover {
  background: #34d399;
}

.keygen-output-card {
  background: #040e0a;
  border: 1px solid #10b98155;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.1);
}

.output-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-label {
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.05em;
}

.output-serial {
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  font-weight: 800;
  color: #34d399;
  letter-spacing: 0.05em;
}

.output-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-output-action {
  flex: 1;
  background: #092017;
  border: 1px solid #143d2a;
  color: #a7f3d0;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-output-action.highlight {
  background: #10b981;
  color: #03140b;
  font-weight: 700;
  border-color: #10b981;
}

.btn-output-action:hover {
  filter: brightness(1.15);
}

.btn-corner-close {
  position: absolute;
  top: 16px;
  right: 18px;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
}

.btn-corner-close:hover {
  color: #ffffff;
}
</style>
