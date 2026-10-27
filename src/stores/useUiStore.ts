import { defineStore } from "pinia";
import { ref } from "vue";

export type ActiveTab = "timeline" | "studio" | "roadmap" | "bookmarks" | "secrets" | "settings";
export type FocusLens = "all" | "notes" | "roadmap" | "vault";

export const useUiStore = defineStore("ui", () => {
  const activeTab = ref<ActiveTab>("timeline");
  const activeLens = ref<FocusLens>(
    typeof localStorage !== "undefined"
      ? ((localStorage.getItem("wolf_active_lens") as FocusLens) || "all")
      : "all"
  );

  // Modal states
  const showQuickCapture = ref<boolean>(false);
  const showCommandPalette = ref<boolean>(false);
  const showFocusEditor = ref<boolean>(false);
  const showSecretScanner = ref<boolean>(false);
  const showSecretEditor = ref<boolean>(false);
  const showBookmarkImporter = ref<boolean>(false);
  const showVoiceGuideModal = ref<boolean>(false);
  const showLicenseModal = ref<boolean>(false);
  const showAiExplorationModal = ref<boolean>(false);
  const activeAiExplorationId = ref<string | null>(null);
  const showCompetitorAuditModal = ref<boolean>(false);
  const showLightbox = ref<boolean>(false);
  const lightboxImageUrl = ref<string>("");
  const lightboxCaption = ref<string>("");
  const lightboxTags = ref<string[]>([]);
  const lightboxGallery = ref<Array<{ url: string; caption?: string; tags?: string[] }>>([]);
  const lightboxIndex = ref<number>(0);

  function openCompetitorAuditModal() {
    showCompetitorAuditModal.value = true;
  }

  function closeCompetitorAuditModal() {
    showCompetitorAuditModal.value = false;
  }

  function openAiExplorationModal(expId: string | null = null) {
    activeAiExplorationId.value = expId;
    showAiExplorationModal.value = true;
  }

  function closeAiExplorationModal() {
    showAiExplorationModal.value = false;
    activeAiExplorationId.value = null;
  }

  // Toast notifications
  const toastMessage = ref<string | null>(null);
  let toastTimer: any = null;

  function setTab(tab: ActiveTab) {
    activeTab.value = tab;
  }

  function setLens(lens: FocusLens) {
    activeLens.value = lens;
    try {
      localStorage.setItem("wolf_active_lens", lens);
    } catch {}

    // Smart auto-navigation based on active lens
    if (lens === "notes") {
      if (activeTab.value !== "timeline" && activeTab.value !== "studio") {
        activeTab.value = "timeline";
      }
    } else if (lens === "roadmap") {
      activeTab.value = "roadmap";
    } else if (lens === "vault") {
      if (activeTab.value !== "secrets" && activeTab.value !== "bookmarks") {
        activeTab.value = "secrets";
      }
    }
  }

  function openLightbox(url: string, caption: string = "", tags: string[] = []) {
    lightboxImageUrl.value = url;
    lightboxCaption.value = caption;
    lightboxTags.value = tags;
    lightboxGallery.value = [{ url, caption, tags }];
    lightboxIndex.value = 0;
    showLightbox.value = true;
  }

  function openGalleryLightbox(images: Array<{ url: string; caption?: string; tags?: string[] }>, startIndex: number = 0) {
    if (!images.length) return;
    lightboxGallery.value = images;
    lightboxIndex.value = Math.max(0, Math.min(startIndex, images.length - 1));
    const cur = images[lightboxIndex.value];
    lightboxImageUrl.value = cur.url;
    lightboxCaption.value = cur.caption || "";
    lightboxTags.value = cur.tags || [];
    showLightbox.value = true;
  }

  function nextLightboxImage() {
    if (!lightboxGallery.value.length) return;
    lightboxIndex.value = (lightboxIndex.value + 1) % lightboxGallery.value.length;
    const cur = lightboxGallery.value[lightboxIndex.value];
    lightboxImageUrl.value = cur.url;
    lightboxCaption.value = cur.caption || "";
    lightboxTags.value = cur.tags || [];
  }

  function prevLightboxImage() {
    if (!lightboxGallery.value.length) return;
    lightboxIndex.value = (lightboxIndex.value - 1 + lightboxGallery.value.length) % lightboxGallery.value.length;
    const cur = lightboxGallery.value[lightboxIndex.value];
    lightboxImageUrl.value = cur.url;
    lightboxCaption.value = cur.caption || "";
    lightboxTags.value = cur.tags || [];
  }

  function closeLightbox() {
    showLightbox.value = false;
    lightboxImageUrl.value = "";
    lightboxCaption.value = "";
    lightboxTags.value = [];
    lightboxGallery.value = [];
    lightboxIndex.value = 0;
  }

  function showToast(msg: string, duration: number = 3000) {
    toastMessage.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage.value = null;
    }, duration);
  }

  return {
    activeTab,
    activeLens,
    setLens,
    showQuickCapture,
    showCommandPalette,
    showFocusEditor,
    showSecretScanner,
    showSecretEditor,
    showBookmarkImporter,
    showVoiceGuideModal,
    showLicenseModal,
    showAiExplorationModal,
    activeAiExplorationId,
    openAiExplorationModal,
    closeAiExplorationModal,
    showCompetitorAuditModal,
    openCompetitorAuditModal,
    closeCompetitorAuditModal,
    showLightbox,
    lightboxImageUrl,
    lightboxCaption,
    lightboxTags,
    lightboxGallery,
    lightboxIndex,
    toastMessage,
    setTab,
    openLightbox,
    openGalleryLightbox,
    nextLightboxImage,
    prevLightboxImage,
    closeLightbox,
    showToast,
  };
});
