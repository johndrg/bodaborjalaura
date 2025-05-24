/**
 * ========================================================================
 * WEDDING CELEBRATION WEB APPLICATION - SIMPLIFIED GALLERY VERSION
 * Enhanced JavaScript with Advanced Video Player Integration
 * ========================================================================
 *
 * Architecture: Modular ES6+ JavaScript with OOP Video Player
 * Performance: Optimized event delegation and memory management
 * Compatibility: Cross-browser support with progressive enhancement
 *
 * @author Technical Development Team
 * @version 2.1.2 - Fixed Secret Gallery Modal Access
 * @license MIT
 */

'use strict';

/**
 * ========================================================================
 * CONSTANTS AND CONFIGURATION
 * ========================================================================
 */
const CONFIG = {
  WEDDING_DATE: "2025-05-09T13:00:00",
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 150,
  VIDEO_SEEK_STEP: 10,
  VOLUME_STEP: 0.1,

  // Bonus puzzle encrypted answers for security
  ENCRYPTED_ANSWERS: [
    'a3hoeXI=', 'a3hoeXJ2', 'ZnJtcnFodg==', 'aWRuaA=='
  ],

  // Direct answers as fallback
  ACCEPTED_ANSWERS: [
    'photoshop', 'fake', 'falsa', 'montaje', 'editada', 'trucada', 'modificada'
  ]
};

/**
 * ========================================================================
 * UTILITY FUNCTIONS
 * ========================================================================
 */

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format time for video player display
 * @param {number} time - Time in seconds
 * @returns {string} Formatted time string (MM:SS)
 */
const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Normalize text for comparison (removes accents and converts to lowercase)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
const normalizeText = (text) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

/**
 * Decrypt bonus puzzle answers for validation
 * @param {string} encrypted - Encrypted answer
 * @returns {string} Decrypted answer
 */
const decryptAnswer = (encrypted) => {
  try {
    return atob(encrypted).split('').map(char =>
      String.fromCharCode(char.charCodeAt(0) - 3)
    ).join('');
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

/**
 * ========================================================================
 * ENHANCED VIDEO PLAYER CLASS
 * ========================================================================
 */
class EnhancedVideoPlayer {
  /**
   * Constructor for Enhanced Video Player
   * @param {HTMLElement} container - Video player container element
   */
  constructor(container) {
    this.container = container;
    this.video = container.querySelector('.video-player');
    this.overlay = container.querySelector('[data-video-overlay]');
    this.controls = container.querySelector('[data-video-controls]');

    // Control elements
    this.playButton = container.querySelector('[data-play-button]');
    this.playPauseBtn = container.querySelector('[data-play-pause-btn]');
    this.progressContainer = container.querySelector('[data-progress-container]');
    this.progressBar = container.querySelector('[data-progress-bar]');
    this.progressHandle = container.querySelector('[data-progress-handle]');
    this.timeDisplay = container.querySelector('[data-time-display]');
    this.muteBtn = container.querySelector('[data-mute-btn]');
    this.volumeSlider = container.querySelector('[data-volume-slider]');
    this.fullscreenBtn = container.querySelector('[data-fullscreen-btn]');

    // State management
    this.isPlaying = false;
    this.isDragging = false;
    this.wasPlayingBeforeDrag = false;
    this.controlsTimeout = null;

    this.initialize();
  }

  /**
   * Initialize video player with event listeners and setup
   */
  initialize() {
    if (!this.video) {
        console.error('Video element not found in container:', this.container);
        return;
    }
    this.setupEventListeners();
    this.setupKeyboardControls();
    this.updateTimeDisplay();
    this.updateVolumeUI(); // Initialize volume UI correctly

    // Hide controls initially
    this.hideControlsAfterDelay();
  }

  /**
   * Setup all event listeners for video player functionality
   */
  setupEventListeners() {
    // Play button overlay events
    this.playButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlay();
    });

    this.overlay?.addEventListener('click', () => this.togglePlay());

    // Control button events
    this.playPauseBtn?.addEventListener('click', () => this.togglePlay());
    this.muteBtn?.addEventListener('click', () => this.toggleMute());
    this.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

    // Progress bar events with enhanced interaction
    this.setupProgressBarEvents();

    // Volume control events
    this.volumeSlider?.addEventListener('input', (e) => {
      this.setVolume(e.target.value);
    });

    // Video element events
    this.setupVideoEvents();

    // Container hover events for control visibility
    this.setupControlVisibility();

    // Touch/mobile support
    this.setupTouchEvents();
  }

  /**
   * Setup progress bar interaction events
   */
  setupProgressBarEvents() {
    if (!this.progressContainer) return;

    // Click to seek
    this.progressContainer.addEventListener('click', (e) => {
      if (!this.isDragging) {
        this.seekTo(e);
      }
    });

    // Drag to seek functionality
    this.progressContainer.addEventListener('mousedown', (e) => {
      this.startDragging(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.seekTo(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.stopDragging();
    });

    // Show handle on hover
    this.progressContainer.addEventListener('mouseenter', () => {
      if (this.progressHandle) {
        this.progressHandle.style.opacity = '1';
      }
    });

    this.progressContainer.addEventListener('mouseleave', () => {
      if (this.progressHandle && !this.isDragging) {
        this.progressHandle.style.opacity = '0';
      }
    });
  }

  /**
   * Setup video element event listeners
   */
  setupVideoEvents() {
    if (!this.video) return;

    this.video.addEventListener('loadedmetadata', () => {
      this.updateTimeDisplay();
      this.updateVolumeUI(); // Ensure volume UI is correct on load
    });

    this.video.addEventListener('timeupdate', () => {
      if (!this.isDragging) {
        this.updateProgress();
        this.updateTimeDisplay();
      }
    });

    this.video.addEventListener('ended', () => {
      this.onVideoEnd();
    });

    this.video.addEventListener('play', () => {
      this.onPlay();
    });

    this.video.addEventListener('pause', () => {
      this.onPause();
    });

    this.video.addEventListener('volumechange', () => {
      this.updateVolumeUI();
    });

    // Click on video to toggle play/pause
    this.video.addEventListener('click', () => {
      this.togglePlay();
    });

    // Double click for fullscreen
    this.video.addEventListener('dblclick', () => {
      this.toggleFullscreen();
    });

    // Loading events
    this.video.addEventListener('waiting', () => {
      this.showBuffering();
    });

    this.video.addEventListener('canplay', () => {
      this.hideBuffering();
    });
  }

  /**
   * Setup control visibility management
   */
  setupControlVisibility() {
    this.container.addEventListener('mouseenter', () => {
      this.showControls();
    });

    this.container.addEventListener('mouseleave', () => {
      this.hideControlsAfterDelay();
    });

    this.container.addEventListener('mousemove', () => {
      this.showControls();
      this.hideControlsAfterDelay();
    });
  }

  /**
   * Setup touch events for mobile devices
   */
  setupTouchEvents() {
    let touchStartX = 0;
    let touchStartTime = 0;

    this.container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    });

    this.container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndTime = Date.now();
      const swipeDistance = Math.abs(touchEndX - touchStartX);
      const swipeTime = touchEndTime - touchStartTime;

      // Detect tap vs swipe
      if (swipeDistance < 10 && swipeTime < 300) {
        // Simple tap - toggle play/pause
        this.togglePlay();
      } else if (swipeDistance > 50 && swipeTime < 500) {
        // Horizontal swipe - seek forward/backward
        const seekTime = touchEndX > touchStartX ? CONFIG.VIDEO_SEEK_STEP : -CONFIG.VIDEO_SEEK_STEP;
        this.seekRelative(seekTime);
      }
    });
  }

  /**
   * Setup keyboard controls for accessibility
   */
  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      const isThisPlayerFullscreen = document.fullscreenElement === this.container;
      const isAnyModalActive = !!document.querySelector('.modal.active');

      let shouldHandleEvent = false;
      if (isThisPlayerFullscreen) {
        shouldHandleEvent = true; // Always handle if this player is fullscreen
      } else if (this.container.matches(':hover') && !isAnyModalActive) {
        // Handle if hovered AND no general modal is active
        shouldHandleEvent = true;
      }

      if (!shouldHandleEvent) {
        return;
      }

      // If focus is on an input field, don't trigger video shortcuts
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
          if (e.code === 'Space' && activeElement.tagName !== 'BUTTON') { // Allow space for button "click"
             // Don't prevent default if typing space in an input
          } else {
            // For other keys, if focus is on input, let default behavior happen for inputs.
            // For Space on non-buttons, it might type a space. For other keys, they might be input characters.
            // This logic might need refinement based on specific UX goals for inputs vs. player shortcuts.
            // For now, if it's an input, and not space on a button, we might not want player shortcuts.
            // However, the initial `shouldHandleEvent` check is primary. This is a sub-condition.
          }
      }


      switch (e.code) {
        case 'Space':
          // Prevent space from scrolling page if player is focused/active
          if (shouldHandleEvent) { // Re-check, as activeElement logic might modify intent
            e.preventDefault();
            this.togglePlay();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.seekRelative(-CONFIG.VIDEO_SEEK_STEP);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.seekRelative(CONFIG.VIDEO_SEEK_STEP);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.adjustVolume(CONFIG.VOLUME_STEP); // CORRECTED: Use VOLUME_STEP
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.adjustVolume(-CONFIG.VOLUME_STEP);
          break;
        case 'KeyM':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          this.toggleFullscreen();
          break;
      }
    });
  }

  /**
   * Start dragging operation for progress bar
   * @param {MouseEvent} e - Mouse event
   */
  startDragging(e) {
    if (!this.video) return;
    this.isDragging = true;
    this.wasPlayingBeforeDrag = !this.video.paused;

    if (this.wasPlayingBeforeDrag) {
      this.video.pause();
    }

    this.seekTo(e);

    if (this.progressHandle) {
      this.progressHandle.style.opacity = '1';
    }
  }

  /**
   * Stop dragging operation for progress bar
   */
  stopDragging() {
    if (!this.isDragging || !this.video) return;

    this.isDragging = false;

    if (this.wasPlayingBeforeDrag) {
      this.video.play();
    }

    if (this.progressHandle) {
      this.progressHandle.style.opacity = '0';
    }
  }

  /**
   * Toggle play/pause state
   */
  togglePlay() {
    if (!this.video) return;
    if (this.video.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  /**
   * Play video
   */
  play() {
    if (!this.video) return;
    const playPromise = this.video.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        // this.isPlaying is set by 'play' event listener (onPlay)
      }).catch(error => {
        console.error('Error playing video:', error);
        // Ensure UI reflects paused state on error
        this.isPlaying = false;
        this.updatePlayButton();
      });
    }
  }

  /**
   * Pause video
   */
  pause() {
    if (!this.video) return;
    this.video.pause();
    // this.isPlaying is set by 'pause' event listener (onPause)
  }

  /**
   * Handle play event
   */
  onPlay() {
    this.isPlaying = true;
    this.hideOverlay();
    this.updatePlayButton();
  }

  /**
   * Handle pause event
   */
  onPause() {
    this.isPlaying = false;
    this.updatePlayButton();
  }

  /**
   * Handle video end event
   */
  onVideoEnd() {
    if (!this.video) return;
    this.isPlaying = false;
    this.showOverlay();
    this.updatePlayButton();
    this.video.currentTime = 0;
    this.updateProgress();
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    if (this.video) {
      this.video.muted = !this.video.muted;
      // volumechange event will trigger updateVolumeUI
    }
  }

  /**
   * Set volume level
   * @param {number} value - Volume value (0-100 from slider)
   */
  setVolume(value) {
    if (this.video) {
      const volume = parseFloat(value) / 100;
      this.video.volume = volume;
      this.video.muted = volume === 0;
      // volumechange event will trigger updateVolumeUI
    }
  }

  /**
   * Adjust volume by relative amount
   * @param {number} delta - Volume change amount (-0.1 to 0.1)
   */
  adjustVolume(delta) {
    if (this.video) {
      let newVolume = this.video.volume + delta;
      newVolume = Math.max(0, Math.min(1, newVolume)); // Clamp between 0 and 1

      this.video.volume = newVolume;
      this.video.muted = newVolume === 0;

      // volumechange event will trigger updateVolumeUI, which updates slider
    }
  }

  /**
   * Seek to specific position in video
   * @param {MouseEvent} e - Mouse event for position calculation
   */
  seekTo(e) {
    if (this.video && this.progressContainer && this.video.duration) {
      const rect = this.progressContainer.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.video.currentTime = percent * this.video.duration;
      this.updateProgress(); // Immediate feedback for dragging
      this.updateTimeDisplay();
    }
  }

  /**
   * Seek by relative time amount
   * @param {number} seconds - Seconds to seek (positive or negative)
   */
  seekRelative(seconds) {
    if (this.video && this.video.duration) {
      const newTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
      this.video.currentTime = newTime;
      // timeupdate event will trigger progress and time display updates
    }
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        // If video element itself is meant to go fullscreen:
        // this.video.requestFullscreen();
        // If container is meant to go fullscreen:
        this.container.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }

  /**
   * Update progress bar visual state
   */
  updateProgress() {
    if (this.video && this.progressBar && this.video.duration > 0) {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      this.progressBar.style.width = `${percent}%`;
    } else if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }
  }

  /**
   * Update time display
   */
  updateTimeDisplay() {
    if (this.video && this.timeDisplay) {
      const current = formatTime(this.video.currentTime);
      const duration = formatTime(this.video.duration || 0);
      this.timeDisplay.textContent = `${current} / ${duration}`;
    }
  }

  /**
   * Update play button icon
   */
  updatePlayButton() {
    const iconClass = this.isPlaying ? 'fa-pause' : 'fa-play';

    if (this.playPauseBtn) {
      const iconElement = this.playPauseBtn.querySelector('i');
      if (iconElement) {
        iconElement.className = `fas ${iconClass}`;
      }
    }
    // Also update the main overlay play button if it exists and is used
    if (this.playButton) {
        const overlayIconElement = this.playButton.querySelector('i');
        if (overlayIconElement) {
             overlayIconElement.className = `fas ${iconClass}`; // Show play or pause on overlay too
        }
    }
  }

  /**
   * Update volume UI elements
   */
  updateVolumeUI() {
    if (!this.video || !this.muteBtn) return;

    const iconElement = this.muteBtn.querySelector('i');
    if (iconElement) {
      if (this.video.muted || this.video.volume === 0) {
        iconElement.className = 'fas fa-volume-mute';
      } else if (this.video.volume < 0.5) {
        iconElement.className = 'fas fa-volume-down';
      } else {
        iconElement.className = 'fas fa-volume-up';
      }
    }

    if (this.volumeSlider) {
      this.volumeSlider.value = this.video.muted ? 0 : this.video.volume * 100;
    }
  }

  /**
   * Show video overlay
   */
  showOverlay() {
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
    }
  }

  /**
   * Hide video overlay
   */
  hideOverlay() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }
  }

  /**
   * Show video controls
   */
  showControls() {
    if (this.controls) {
      this.controls.classList.add('visible');
    }
    this.clearControlsTimeout();
  }

  /**
   * Hide video controls after delay
   */
  hideControlsAfterDelay() {
    this.clearControlsTimeout();
    this.controlsTimeout = setTimeout(() => {
      if (this.controls && this.isPlaying && !this.isDragging) { // Don't hide if dragging
        // Check if mouse is still over the container or controls; if so, don't hide.
        // This requires more complex logic or relying on mouseleave from container.
        // For now, keep it simple: if playing and not dragging, hide after timeout.
        if (!this.container.matches(':hover') && !this.controls.matches(':hover')) {
             this.controls.classList.remove('visible');
        } else {
            // If still hovering, reset timeout
            this.hideControlsAfterDelay();
        }
      }
    }, 3000);
  }

  /**
   * Clear controls timeout
   */
  clearControlsTimeout() {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
      this.controlsTimeout = null;
    }
  }

  /**
   * Show buffering indicator
   */
  showBuffering() {
    // Could implement a loading spinner here
    this.container.classList.add('video-buffering');
    console.log('Video buffering...');
  }

  /**
   * Hide buffering indicator
   */
  hideBuffering() {
    // Hide loading spinner
    this.container.classList.remove('video-buffering');
    console.log('Video ready to play');
  }

  /**
   * Destroy video player and clean up event listeners
   */
  destroy() {
    this.clearControlsTimeout();
    // TODO: Add comprehensive event listener removal here
    // For now, just nullify references
    this.video = null;
    this.container = null;
    // Ideally, listeners added to `document` should also be removed
    // (e.g., mousemove/mouseup for dragging, keydown for keyboard controls)
    // This requires storing bound event handlers to remove them later.
  }
}

/**
 * ========================================================================
 * MODAL SYSTEM CLASS - FIXED TO PREVENT SECRET GALLERY ACCESS
 * ========================================================================
 */
class ModalSystem {
  constructor() {
    this.modal = document.getElementById('photo-modal');
    this.modalImg = document.getElementById('modal-img');
    this.modalVideoContainer = document.getElementById('modal-video-container');
    this.modalVideo = document.getElementById('modal-video');
    this.closeModal = document.getElementById('close-modal');
    this.modalSpinner = document.getElementById('modal-spinner');
    this.modalCounter = document.getElementById('modal-counter');
    this.prevBtn = document.getElementById('prev-photo');
    this.nextBtn = document.getElementById('next-photo');

    this.currentIndex = 0;
    this.mediaItems = [];
    this.isOpen = false;

    this.initialize();
  }

  initialize() {
    this.collectMediaItems();
    this.setupEventListeners();
  }

  /**
   * FIXED: Only collect media items that should be accessible
   * This prevents access to secret gallery items until they are revealed
   */
  collectMediaItems() {
    // Always include main gallery items
    const mainGalleryItems = document.querySelectorAll('#gallery-section [data-type]');

    // Only include secret gallery items if their parent gallery is visible
    const secretGalleries = document.querySelectorAll('.secret-gallery');
    const revealedSecretItems = [];

    secretGalleries.forEach(gallery => {
      // Check if the secret gallery is revealed (display is not 'none')
      const isRevealed = window.getComputedStyle(gallery).display !== 'none';
      if (isRevealed) {
        // Select direct children that are media items, or deeper items if structure requires
        const secretItems = gallery.querySelectorAll(':scope > .secret-gallery-container [data-type], :scope > [data-type]');
        revealedSecretItems.push(...secretItems);
      }
    });

    const allAccessibleItems = [...mainGalleryItems, ...revealedSecretItems];

    // Remove previous event listeners from old items to prevent duplicates if refreshMediaItems is called
    this.mediaItems.forEach(item => {
        if (item.element && item.clickHandler) {
            item.element.removeEventListener('click', item.clickHandler);
        }
    });


    this.mediaItems = Array.from(allAccessibleItems).map((item, index) => ({
      src: item.getAttribute('data-src'),
      type: item.getAttribute('data-type'),
      alt: item.querySelector('img')?.alt || item.closest('[data-type]')?.querySelector('.secret-image-caption')?.textContent || `Media ${index + 1}`,
      element: item
    }));
  }

  setupEventListeners() {
    // Close modal events
    this.closeModal?.addEventListener('click', () => this.close());

    // Navigation events
    this.prevBtn?.addEventListener('click', () => this.navigate('prev'));
    this.nextBtn?.addEventListener('click', () => this.navigate('next'));

    // Modal overlay click to close
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      switch (e.key) { // Use e.key for modern browsers
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.navigate('prev');
          break;
        case 'ArrowRight':
          this.navigate('next');
          break;
      }
    });

    // Media item click events
    this.setupMediaClickEvents();
  }

  setupMediaClickEvents() {
    this.mediaItems.forEach((item, index) => {
      // Store the handler to be able to remove it later if needed
      item.clickHandler = () => {
        this.open(index);
      };
      item.element.addEventListener('click', item.clickHandler);
    });
  }

  open(index) {
    if (index < 0 || index >= this.mediaItems.length) return;
    this.currentIndex = index;
    this.isOpen = true;

    const item = this.mediaItems[this.currentIndex];

    if (item.type === 'video') {
      this.showVideo(item);
    } else {
      this.showImage(item);
    }

    this.updateCounter();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }

  showImage(item) {
    this.modalVideoContainer.style.display = 'none';
    if (this.modalVideo) this.modalVideo.pause(); // Pause video if it was playing
    this.modalImg.style.display = 'block';

    this.showSpinner();
    this.modalImg.classList.remove('loaded'); // Reset loaded class

    this.modalImg.onload = () => {
      this.hideSpinner();
      this.modalImg.classList.add('loaded');
    };
    this.modalImg.onerror = () => {
        this.hideSpinner();
        // Handle image load error, e.g., show a placeholder or error message
        console.error("Failed to load image:", item.src);
    };

    this.modalImg.src = item.src;
    this.modalImg.alt = item.alt;
  }

  showVideo(item) {
    this.modalImg.style.display = 'none';
    this.modalVideoContainer.style.display = 'block';
    this.modalVideoContainer.classList.remove('loaded'); // Reset loaded class

    if (this.modalVideo) {
        this.modalVideo.src = item.src;
        this.modalVideo.load(); // Important to load the new source
        this.modalVideo.play().catch(e => console.error("Error playing modal video:", e)); // Autoplay, handle promise
        this.modalVideoContainer.classList.add('loaded'); // Add loaded once src is set
    }
  }

  navigate(direction) {
    if (!this.mediaItems.length) return;
    if (direction === 'next') {
      this.currentIndex = (this.currentIndex + 1) % this.mediaItems.length;
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.mediaItems.length) % this.mediaItems.length;
    }

    // No need to call resetModalContent here, open() will handle new content
    this.open(this.currentIndex);
  }

  close() {
    this.isOpen = false;
    this.modal.classList.remove('active');
    this.resetModalContent();

    document.body.style.overflow = 'auto'; // Restore scroll
  }

  resetModalContent() {
    this.modalImg.classList.remove('loaded');
    this.modalVideoContainer.classList.remove('loaded');
    if (this.modalVideo) {
        this.modalVideo.pause();
        this.modalVideo.removeAttribute('src'); // More robust reset
        this.modalVideo.load(); // Reset video element state
    }
    this.modalImg.src = ''; // Use empty string for src to clear image
    this.modalImg.alt = '';
    this.hideSpinner();
  }

  showSpinner() {
    if (this.modalSpinner) {
      this.modalSpinner.style.display = 'block';
    }
  }

  hideSpinner() {
    if (this.modalSpinner) {
      this.modalSpinner.style.display = 'none';
    }
  }

  updateCounter() {
    if (this.modalCounter && this.mediaItems.length > 0) {
      this.modalCounter.textContent = `${this.currentIndex + 1}/${this.mediaItems.length}`;
    } else if (this.modalCounter) {
      this.modalCounter.textContent = `0/0`;
    }
  }

  /**
   * FIXED: Refresh method that properly re-collects accessible items
   * This method is called when secret galleries are revealed
   */
  refreshMediaItems() {
    this.collectMediaItems(); // This now also removes old listeners
    this.setupMediaClickEvents(); // Add listeners to new set of items
    this.updateCounter(); // Update counter if modal is open or items change
  }
}

/**
 * ========================================================================
 * PUZZLE SYSTEM CLASS - FIXED SECRET GALLERY REVEAL
 * ========================================================================
 */
class PuzzleSystem {
  constructor(config) {
    this.sectionId = config.sectionId;
    this.checkBtnId = config.checkBtnId;
    this.successId = config.successId;
    this.failureId = config.failureId;
    this.galleryId = config.galleryId;
    this.questionClass = config.questionClass;
    this.optionClass = config.optionClass;

    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const checkBtn = document.getElementById(this.checkBtnId);
    const section = document.getElementById(this.sectionId);

    if (!checkBtn || !section) return;

    checkBtn.addEventListener('click', () => {
      this.validateAnswers();
    });

    // Setup option selection
    const options = section.querySelectorAll(`.${this.optionClass}`);
    options.forEach(option => {
      option.addEventListener('click', () => {
        this.selectOption(option);
      });
    });
  }

  selectOption(selectedOption) {
    const questionElement = selectedOption.closest(`.${this.questionClass}, .puzzle-question-2`);
    if (!questionElement) return;
    const siblings = questionElement.querySelectorAll(`.${this.optionClass}`);
    siblings.forEach(sibling => sibling.classList.remove('selected'));
    selectedOption.classList.add('selected');
  }

  validateAnswers() {
    const section = document.getElementById(this.sectionId);
    const questions = section.querySelectorAll(`.${this.questionClass}, .puzzle-question-2`); // Include both question types
    let allCorrect = true;

    questions.forEach(question => {
      const correctIndex = parseInt(question.getAttribute('data-correct'));
      const selected = question.querySelector(`.${this.optionClass}.selected, .question-option-2.selected`);

      if (!selected || parseInt(selected.getAttribute('data-index')) !== correctIndex) {
        allCorrect = false;
        question.classList.add('incorrect');
        question.classList.remove('correct');
      } else {
        question.classList.add('correct');
        question.classList.remove('incorrect');
      }
    });

    this.showResult(allCorrect);
  }

  showResult(success) {
    const successElement = document.getElementById(this.successId);
    const failureElement = document.getElementById(this.failureId);
    const galleryElement = document.getElementById(this.galleryId);

    if (!successElement || !failureElement || !galleryElement) return;


    if (success) {
      successElement.style.display = 'block';
      failureElement.style.display = 'none';
      galleryElement.style.display = 'block'; // Or 'grid' or 'flex' depending on CSS

      // FIXED: Reveal secret images with proper animation
      // Ensure galleryElement itself is visible before animating children
      galleryElement.offsetHeight; // Force reflow

      const secretImageContainers = galleryElement.querySelectorAll('.secret-image-container, .video-player-container');
      secretImageContainers.forEach((container, index) => {
        setTimeout(() => {
          container.classList.add('revealed');
        }, index * 200); // Staggered animation
      });

      // FIXED: Update modal system to include new items AFTER they are revealed and animations likely started/done
      if (window.modalSystem) {
         // Delay should be enough for CSS display and animations to kick in
        setTimeout(() => {
          window.modalSystem.refreshMediaItems();
        }, secretImageContainers.length * 200 + 300); // Wait for all staggered animations + a buffer
      }
    // Trigger confetti animation
    if (typeof confetti !== 'undefined') {
        confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
        });
    }
    } else {
      successElement.style.display = 'none';
      failureElement.style.display = 'block';
      galleryElement.style.display = 'none';
    }
  }
}

/**
 * ========================================================================
 * BONUS SYSTEM CLASS
 * ========================================================================
 */
class BonusSystem {
  constructor() {
    this.bonusButton = document.getElementById('bonus-button');
    this.bonusContent = document.getElementById('bonus-content');
    this.bonusForm = document.getElementById('bonus-form');
    this.bonusAnswer = document.getElementById('bonus-answer');
    this.bonusResult = document.getElementById('bonus-result');
    this.bonusHint = document.querySelector('.bonus-hint');

    this.failedAttempts = 0;

    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle bonus content
    this.bonusButton?.addEventListener('click', () => {
      this.toggleContent();
    });

    // Handle form submission
    this.bonusForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.checkAnswer();
    });
  }

  toggleContent() {
    if (this.bonusContent) {
      this.bonusContent.classList.toggle('revealed');
    }
  }

  checkAnswer() {
    const answer = normalizeText(this.bonusAnswer.value.trim());
    let isCorrect = false;

    // Check encrypted answers
    for (const encryptedAnswer of CONFIG.ENCRYPTED_ANSWERS) {
      const decryptedAnswer = decryptAnswer(encryptedAnswer);
      if (decryptedAnswer && answer.includes(decryptedAnswer)) { // Ensure decryptedAnswer is not empty
        isCorrect = true;
        break;
      }
    }

    // Check direct answers as fallback
    if (!isCorrect) {
      isCorrect = CONFIG.ACCEPTED_ANSWERS.some(validAnswer =>
        answer.includes(normalizeText(validAnswer)) // Normalize validAnswer as well for consistency
      );
    }

    if (isCorrect) {
      this.showSuccessResult();
    } else {
      this.handleIncorrectAnswer();
    }
  }

  showSuccessResult() {
    this.failedAttempts = 0;
    this.bonusResult.classList.add('revealed');
    // bonusResult display style is handled by CSS .revealed usually, ensure it becomes visible
    // If .revealed itself doesn't set display, then:
    this.bonusResult.style.display = 'block'; // Or whatever its natural display is

    // Add highlight animation
    setTimeout(() => {
      this.bonusResult.classList.add('highlight-animation');
    }, 400); // Delay to sync with reveal transition

    // Trigger confetti
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }

  handleIncorrectAnswer() {
    this.failedAttempts++;

    // Show hint after 5 failed attempts
    if (this.failedAttempts >= 5 && this.bonusHint) {
      this.bonusHint.classList.add('visible');
    }

    // Add shake animation to input
    this.bonusAnswer.classList.add('shake');
    setTimeout(() => {
      this.bonusAnswer.classList.remove('shake');
    }, 500);
  }
}

/**
 * ========================================================================
 * SIMPLIFIED GALLERY SYSTEM CLASS
 * ========================================================================
 */
class SimplifiedGallerySystem {
  constructor() {
    this.galleryContainer = document.getElementById('gallery-container');
    // Query for items within the specific gallery container
    this.galleryItems = this.galleryContainer ? this.galleryContainer.querySelectorAll('.gallery-item') : [];


    this.initialize();
  }

  initialize() {
    if (!this.galleryContainer) return; // Do nothing if container doesn't exist
    this.handleImageLoading();
    this.setupResponsiveLayout();
  }

  handleImageLoading() {
    // Add loading animation to images
    this.galleryItems.forEach((item, index) => {
      const img = item.querySelector('img');

      if (!img) {
        item.classList.add('loaded'); // Mark as loaded if no image (e.g. video placeholder)
        return;
      }

      // Staggered animation logic
      const delay = index * 100;

      if (img.complete && img.naturalHeight !== 0) { // Check if image is already loaded and valid
        setTimeout(() => {
          item.classList.add('loaded');
        }, delay);
      } else {
        img.addEventListener('load', () => {
          setTimeout(() => {
            item.classList.add('loaded');
          }, delay);
        });
        img.addEventListener('error', () => {
            // Handle error: mark as loaded to unblock sequence, or add error class
            console.error("Failed to load gallery image:", img.src);
            setTimeout(() => {
                item.classList.add('loaded'); // Or item.classList.add('load-error');
            }, delay);
        });
      }
    });
  }

  setupResponsiveLayout() {
    // Handle responsive breakpoints for gallery layout
    // This is mostly handled by CSS Grid, but JS can hook in if needed.
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const handleBreakpointChange = (e) => {
      // Example: if (e.matches) { // tablet/mobile } else { // desktop }
      // No special handling needed for simplified grid as per original comment
    };

    // addListener is deprecated, use addEventListener
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleBreakpointChange);
    } else if (mediaQuery.addListener) { // Fallback for older browsers
        mediaQuery.addListener(handleBreakpointChange);
    }

    handleBreakpointChange(mediaQuery); // Initial check
  }

  /**
   * Método para añadir nuevas imágenes dinámicamente
   * @param {string} src - URL de la imagen
   * @param {string} alt - Texto alternativo
   * @returns {number} - Índice de la nueva imagen
   */
  addGalleryImage(src, alt = '') {
    if (!this.galleryContainer) return -1; // Return -1 or throw error if no container

    const newItem = document.createElement('div');
    newItem.className = 'gallery-item';
    newItem.setAttribute('data-type', 'image');
    newItem.setAttribute('data-src', src);

    const newImg = document.createElement('img');
    newImg.src = src;
    newImg.alt = alt || `Momento especial ${this.galleryItems.length + 1}`;
    newImg.className = 'gallery-img';

    newItem.appendChild(newImg);
    this.galleryContainer.appendChild(newItem);

    // Handle loading for new image (without staggered delay, or apply based on new length)
    if (newImg.complete && newImg.naturalHeight !== 0) {
        newItem.classList.add('loaded');
    } else {
        newImg.addEventListener('load', () => {
          newItem.classList.add('loaded');
        });
        newImg.addEventListener('error', () => {
          newItem.classList.add('loaded'); // Or error state
          console.error("Failed to load dynamically added image:", src);
        });
    }


    // Update gallery items collection
    this.galleryItems = this.galleryContainer.querySelectorAll('.gallery-item');

    // If modal system exists and needs to be aware of new items immediately:
    if (window.modalSystem) {
        window.modalSystem.refreshMediaItems();
    }

    return this.galleryItems.length -1; // Return the index of the new item
  }
}

/**
 * ========================================================================
 * WEDDING COUNTER UTILITY
 * ========================================================================
 */
class WeddingCounter {
  constructor() {
    this.counterElement = document.getElementById('wedding-counter'); // Renamed for clarity
    this.weddingDate = new Date(CONFIG.WEDDING_DATE); // Renamed for clarity
    this.intervalId = null; // To store interval ID for potential clearing

    if (this.counterElement) {
      this.start();
    }
  }

  start() {
    this.update(); // Initial update
    this.intervalId = setInterval(() => this.update(), 1000);
  }

  update() {
    const now = new Date();
    // Ensure weddingDate is valid
    if (isNaN(this.weddingDate.getTime())) {
        this.counterElement.textContent = "Fecha de boda no válida.";
        if (this.intervalId) clearInterval(this.intervalId);
        return;
    }

    const diffMs = now - this.weddingDate;

    if (diffMs < 0) {
        // Future date handling (countdown to wedding)
        const timeToWedding = Math.abs(diffMs);
        const days = Math.floor(timeToWedding / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeToWedding % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeToWedding % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeToWedding % (1000 * 60)) / 1000);
        this.counterElement.textContent = `Faltan para la boda: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        return;
    }

    // Past date handling (married for)
    // Using simple subtraction for days assumes same timezone or UTC logic consistently.
    // For precise day counting across timezones, a library like date-fns or moment.js is better.
    // This simplified version calculates total elapsed time.
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);


    this.counterElement.textContent = `Llevan casados ${days} días, ${hours}h, ${minutes}m, ${seconds}s.`;
  }

  stop() { // Method to stop the counter if needed
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
  }
}

/**
 * ========================================================================
 * APPLICATION INITIALIZATION
 * ========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Wedding Counter
  const weddingCounter = new WeddingCounter();

  // Initialize Smooth Scrolling
  const scrollButton = document.getElementById('scroll-down');
  scrollButton?.addEventListener('click', () => {
    const firstSection = document.querySelector('.section'); // Target first actual section
    if (firstSection) {
        window.scrollTo({
          top: firstSection.offsetTop,
          behavior: 'smooth'
        });
    }
  });

  // Initialize Enhanced Video Players
  const videoContainers = document.querySelectorAll('.video-player-container');
  const videoPlayers = Array.from(videoContainers).map(container =>
    new EnhancedVideoPlayer(container)
  );

  // Initialize Modal System and make it globally accessible
  const modalSystem = new ModalSystem();
  window.modalSystem = modalSystem; // Make globally accessible for puzzle system

  // Initialize Puzzle Systems
  const puzzle1 = new PuzzleSystem({
    sectionId: 'puzzle-section',
    checkBtnId: 'check-answers-btn',
    successId: 'puzzle-success',
    failureId: 'puzzle-failure',
    galleryId: 'secret-gallery',
    questionClass: 'puzzle-question', // Specific to puzzle 1
    optionClass: 'question-option'    // Specific to puzzle 1
  });

  const puzzle2 = new PuzzleSystem({
    sectionId: 'puzzle-section-2',
    checkBtnId: 'check-answers-btn-2',
    successId: 'puzzle-success-2',
    failureId: 'puzzle-failure-2',
    galleryId: 'secret-gallery-2',
    questionClass: 'puzzle-question-2', // Specific to puzzle 2
    optionClass: 'question-option-2'    // Specific to puzzle 2
  });

  // Initialize Bonus System
  const bonusSystem = new BonusSystem();

  // Initialize Simplified Gallery System
  const gallerySystem = new SimplifiedGallerySystem();

  // Performance monitoring
  if (window.performance && window.performance.mark) {
    window.performance.mark('app-initialized');
    // Example: window.performance.measure('initToInteractive', 'navigationStart', 'app-initialized');
  }

  // Global Error handling
  window.addEventListener('error', (event) => { // event is the ErrorEvent
    console.error('Global application error:', event.message, 'at', event.filename, ':', event.lineno, event.error);
    // Potentially log to a server:
    // Sentry.captureException(event.error || new Error(event.message));
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Sentry.captureException(event.reason);
  });


  // Expose systems to global scope for debugging (development only)
  // A common check for NODE_ENV might not work directly in browser unless set by build tool
  // A simpler check could be `window.location.hostname === 'localhost'` or a query param.
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevelopment) {
    window.app = {
      weddingCounter,
      videoPlayers,
      modalSystem,
      puzzle1,
      puzzle2,
      bonusSystem,
      gallerySystem
    };
    console.log('App systems exposed to window.app for debugging.', window.app);
  }
});

/**
 * ========================================================================
 * POLYFILLS AND COMPATIBILITY
 * ========================================================================
 */

// Basic Element.matches polyfill
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// Basic Element.closest polyfill
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (Element.prototype.matches.call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}


// Intersection Observer polyfill for older browsers
// Consider loading this conditionally via a script tag if IntersectionObserver is not supported,
// or bundling it with a build tool.
// Example: if (!('IntersectionObserver' in window)) { /* load polyfill */ }
if (!window.IntersectionObserver) {
  console.warn('IntersectionObserver not supported, consider adding polyfill for optimal lazy loading or animations.');
}

// RequestAnimationFrame polyfill (though widely supported now)
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


// Export for module systems (if needed)
// This structure is more for Node.js/CommonJS. For ES modules, use `export class ...`
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EnhancedVideoPlayer,
    ModalSystem,
    PuzzleSystem,
    BonusSystem,
    SimplifiedGallerySystem,
    WeddingCounter,
    CONFIG,
    debounce,
    formatTime,
    normalizeText,
    decryptAnswer
  };
}