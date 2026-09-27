<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useUiStore } from "@/stores/useUiStore";

const uiStore = useUiStore();

function handleKeydown(e: KeyboardEvent) {
  if (!uiStore.showLightbox) return;
  if (e.key === "Escape") {
    uiStore.closeLightbox();
  } else if (e.key === "ArrowRight") {
    uiStore.nextLightboxImage();
  } else if (e.key === "ArrowLeft") {
    uiStore.prevLightboxImage();
  }
}

function copyImageUrl() {
  if (uiStore.lightboxImageUrl) {
    navigator.clipboard.writeText(uiStore.lightboxImageUrl);
    uiStore.showToast("Image URL copied to clipboard ✓");
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div v-if="uiStore.showLightbox" class="modal-overlay" @click.self="uiStore.closeLightbox">
    <div class="lightbox-window">
      <!-- Header -->
      <div class="lightbox-header">
        <div class="lightbox-title-area">
          <span class="lightbox-icon">🖼️</span>
          <span class="lightbox-caption">{{ uiStore.lightboxCaption || "Visual Reference Preview" }}</span>
          <span v-if="uiStore.lightboxGallery.length > 1" class="lightbox-counter">
            {{ uiStore.lightboxIndex + 1 }} / {{ uiStore.lightboxGallery.length }}
          </span>
        </div>
        <div class="lightbox-header-actions">
          <button type="button" class="btn-lightbox-action" @click="copyImageUrl" title="Copy Image URL">
            📋 Copy URL
          </button>
          <button type="button" class="btn-lightbox-close" @click="uiStore.closeLightbox" title="Close (Esc)">✕</button>
        </div>
      </div>

      <!-- Body / Stage -->
      <div class="lightbox-body">
        <button
          v-if="uiStore.lightboxGallery.length > 1"
          type="button"
          class="btn-lightbox-nav prev"
          @click="uiStore.prevLightboxImage"
          title="Previous Image (←)"
        >
          ‹
        </button>

        <img :src="uiStore.lightboxImageUrl" :alt="uiStore.lightboxCaption" class="lightbox-full-img" />

        <button
          v-if="uiStore.lightboxGallery.length > 1"
          type="button"
          class="btn-lightbox-nav next"
          @click="uiStore.nextLightboxImage"
          title="Next Image (→)"
        >
          ›
        </button>
      </div>

      <!-- Footer with Tags -->
      <div v-if="uiStore.lightboxTags?.length" class="lightbox-footer">
        <span class="tags-label">Tags:</span>
        <div class="lightbox-tags-list">
          <span v-for="tag in uiStore.lightboxTags" :key="tag" class="lightbox-tag-pill">
            #{{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 6, 0.94);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 24px;
}

.lightbox-window {
  max-width: 92vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #06140f;
  border: 1px solid #10b98144;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(16, 185, 129, 0.15);
}

.lightbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #040c08;
  border-bottom: 1px solid #0f271d;
  gap: 16px;
}

.lightbox-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.lightbox-icon {
  font-size: 16px;
}

.lightbox-caption {
  font-size: 14px;
  font-weight: 700;
  color: #ecfdf5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lightbox-counter {
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 2px 8px;
  border-radius: 12px;
}

.lightbox-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-lightbox-action {
  background: #092017;
  border: 1px solid #143828;
  color: #a7f3d0;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-lightbox-action:hover {
  background: #10b981;
  color: #022c22;
}

.btn-lightbox-close {
  background: #092017;
  border: 1px solid #143828;
  color: #9ca3af;
  font-size: 14px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-lightbox-close:hover {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

.lightbox-body {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  max-height: 75vh;
  padding: 16px;
  background: radial-gradient(circle at center, #071913 0%, #030a07 100%);
}

.lightbox-full-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
}

.btn-lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(6, 20, 15, 0.85);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #ecfdf5;
  font-size: 28px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(8px);
}

.btn-lightbox-nav.prev {
  left: 18px;
}

.btn-lightbox-nav.next {
  right: 18px;
}

.btn-lightbox-nav:hover {
  background: #10b981;
  color: #022c22;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
}

.lightbox-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #040c08;
  border-top: 1px solid #0f271d;
}

.tags-label {
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
}

.lightbox-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lightbox-tag-pill {
  font-size: 11px;
  font-weight: 600;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}
</style>
