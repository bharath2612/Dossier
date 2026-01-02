import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIStore {
  // Presenter mode state
  isPresenterMode: boolean;
  currentSlideIndex: number;
  showSpeakerNotes: boolean;
  isFullscreen: boolean;
  totalSlides: number;

  // Modal states
  isAuthModalOpen: boolean;
  isShareModalOpen: boolean;
  isDeleteConfirmOpen: boolean;

  // Actions
  setPresenterMode: (enabled: boolean) => void;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  toggleSpeakerNotes: () => void;
  toggleFullscreen: () => void;
  setTotalSlides: (total: number) => void;

  // Modal actions
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openShareModal: () => void;
  closeShareModal: () => void;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;

  // Keyboard navigation
  handleKeyPress: (key: string) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isPresenterMode: false,
      currentSlideIndex: 0,
      showSpeakerNotes: false,
      isFullscreen: false,
      totalSlides: 0,
      isAuthModalOpen: false,
      isShareModalOpen: false,
      isDeleteConfirmOpen: false,

      // Actions
      setPresenterMode: (enabled) => {
        set({ isPresenterMode: enabled });
        if (enabled) {
          // Request fullscreen when entering presenter mode
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
              // Fullscreen request failed, just continue
            });
          }
        } else {
          // Exit fullscreen when leaving presenter mode
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        }
      },

      goToSlide: (index) => {
        const { totalSlides } = get();
        if (index >= 0 && index < totalSlides) {
          set({ currentSlideIndex: index });
        }
      },

      nextSlide: () => {
        const { currentSlideIndex, totalSlides } = get();
        if (currentSlideIndex < totalSlides - 1) {
          set({ currentSlideIndex: currentSlideIndex + 1 });
        }
      },

      previousSlide: () => {
        const { currentSlideIndex } = get();
        if (currentSlideIndex > 0) {
          set({ currentSlideIndex: currentSlideIndex - 1 });
        }
      },

      toggleSpeakerNotes: () =>
        set((state) => ({ showSpeakerNotes: !state.showSpeakerNotes })),

      toggleFullscreen: () => {
        const { isFullscreen } = get();
        if (!isFullscreen) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        } else {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        }
        set({ isFullscreen: !isFullscreen });
      },

      setTotalSlides: (total) => set({ totalSlides: total }),

      // Modal actions
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      openShareModal: () => set({ isShareModalOpen: true }),
      closeShareModal: () => set({ isShareModalOpen: false }),
      openDeleteConfirm: () => set({ isDeleteConfirmOpen: true }),
      closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false }),

      // Keyboard navigation
      handleKeyPress: (key) => {
        const { isPresenterMode, goToSlide, nextSlide, previousSlide, setPresenterMode } = get();

        if (!isPresenterMode) return;

        switch (key) {
          case 'ArrowRight':
          case ' ':
            nextSlide();
            break;
          case 'ArrowLeft':
            previousSlide();
            break;
          case 'Home':
            goToSlide(0);
            break;
          case 'End':
            goToSlide(get().totalSlides - 1);
            break;
          case 'Escape':
            setPresenterMode(false);
            break;
          // Number keys (1-9, 0)
          default:
            const num = parseInt(key);
            if (!isNaN(num) && num >= 0 && num <= 9) {
              // If single digit, go to that slide (1-based index)
              if (num > 0) {
                goToSlide(num - 1);
              }
            }
            break;
        }
      },
    }),
    { name: 'UIStore' }
  )
);

// Set up keyboard event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    const { handleKeyPress, isPresenterMode } = useUIStore.getState();
    if (isPresenterMode) {
      handleKeyPress(e.key);
    }
  });

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    const { isFullscreen } = useUIStore.getState();
    const isNowFullscreen = !!document.fullscreenElement;
    if (isFullscreen !== isNowFullscreen) {
      useUIStore.setState({ isFullscreen: isNowFullscreen });
    }
  });
}
