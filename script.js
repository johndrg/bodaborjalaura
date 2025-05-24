/**
 * ========================================================================
 * WEDDING CELEBRATION WEB APPLICATION
 * Enhanced JavaScript with Advanced Video Player Integration
 * ========================================================================
 * 
 * Architecture: Modular ES6+ JavaScript with OOP Video Player
 * Performance: Optimized event delegation and memory management
 * Compatibility: Cross-browser support with progressive enhancement
 * 
 * @author Technical Development Team
 * @version 2.0.0
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
    this.setupEventListeners();
    this.setupKeyboardControls();
    this.updateTimeDisplay();
    
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
      // Only handle keys if this video is in focus or modal is open
      if (!this.container.matches(':hover') && !document.querySelector('.modal.active')) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlay();
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
          this.adjustVolume(CONFIG.VOLUME_STEP);
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
    if (!this.isDragging) return;
    
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
    const playPromise = this.video.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.isPlaying = true;
        this.hideOverlay();
        this.updatePlayButton();
      }).catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }

  /**
   * Pause video
   */
  pause() {
    this.video.pause();
    this.isPlaying = false;
    this.updatePlayButton();
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
      this.updateVolumeUI();
    }
  }

  /**
   * Set volume level
   * @param {number} value - Volume value (0-100)
   */
  setVolume(value) {
    if (this.video) {
      const volume = value / 100;
      this.video.volume = volume;
      this.video.muted = volume === 0;
      this.updateVolumeUI();
    }
  }

  /**
   * Adjust volume by relative amount
   * @param {number} delta - Volume change amount (-1 to 1)
   */
  adjustVolume(delta) {
    if (this.video) {
      const newVolume = Math.max(0, Math.min(1, this.video.volume + delta));
      this.video.volume = newVolume;
      this.video.muted = newVolume === 0;
      
      if (this.volumeSlider) {
        this.volumeSlider.value = newVolume * 100;
      }
      
      this.updateVolumeUI();
    }
  }

  /**
   * Seek to specific position in video
   * @param {MouseEvent} e - Mouse event for position calculation
   */
  seekTo(e) {
    if (this.video && this.progressContainer) {
      const rect = this.progressContainer.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.video.currentTime = percent * this.video.duration;
      this.updateProgress();
    }
  }

  /**
   * Seek by relative time amount
   * @param {number} seconds - Seconds to seek (positive or negative)
   */
  seekRelative(seconds) {
    if (this.video) {
      const newTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
      this.video.currentTime = newTime;
      this.updateProgress();
    }
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        this.container.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }

  /**
   * Update progress bar visual state
   */
  updateProgress() {
    if (this.video && this.progressBar && this.video.duration) {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      this.progressBar.style.width = `${percent}%`;
    }
  }

  /**
   * Update time display
   */
  updateTimeDisplay() {
    if (this.video && this.timeDisplay) {
      const current = formatTime(this.video.currentTime);
      const duration = formatTime(this.video.duration);
      this.timeDisplay.textContent = `${current} / ${duration}`;
    }
  }

  /**
   * Update play button icon
   */
  updatePlayButton() {
    const icon = this.isPlaying ? 'fa-pause' : 'fa-play';
    
    if (this.playPauseBtn) {
      const iconElement = this.playPauseBtn.querySelector('i');
      if (iconElement) {
        iconElement.className = `fas ${icon}`;
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
      if (this.controls && this.isPlaying) {
        this.controls.classList.remove('visible');
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
    console.log('Video buffering...');
  }

  /**
   * Hide buffering indicator
   */
  hideBuffering() {
    // Hide loading spinner
    console.log('Video ready to play');
  }

  /**
   * Destroy video player and clean up event listeners
   */
  destroy() {
    this.clearControlsTimeout();
    // Remove event listeners and clean up
    this.video = null;
    this.container = null;
  }
}

/**
 * ========================================================================
 * MODAL SYSTEM CLASS
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

  collectMediaItems() {
    const items = document.querySelectorAll('[data-type]');
    this.mediaItems = Array.from(items).map((item, index) => ({
      src: item.getAttribute('data-src'),
      type: item.getAttribute('data-type'),
      alt: item.querySelector('img')?.alt || `Media ${index + 1}`,
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
      
      switch (e.key) {
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
      item.element.addEventListener('click', () => {
        this.open(index);
      });
    });
  }

  open(index) {
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
    document.body.style.overflow = 'hidden';
  }

  showImage(item) {
    this.modalVideoContainer.style.display = 'none';
    this.modalImg.style.display = 'block';
    
    this.showSpinner();
    
    this.modalImg.onload = () => {
      this.hideSpinner();
      this.modalImg.classList.add('loaded');
    };
    
    this.modalImg.src = item.src;
    this.modalImg.alt = item.alt;
  }

  showVideo(item) {
    this.modalImg.style.display = 'none';
    this.modalVideoContainer.style.display = 'block';
    
    this.modalVideo.src = item.src;
    this.modalVideoContainer.classList.add('loaded');
  }

  navigate(direction) {
    if (direction === 'next') {
      this.currentIndex = (this.currentIndex + 1) % this.mediaItems.length;
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.mediaItems.length) % this.mediaItems.length;
    }
    
    this.resetModalContent();
    this.open(this.currentIndex);
  }

  close() {
    this.isOpen = false;
    this.modal.classList.remove('active');
    this.resetModalContent();
    
    setTimeout(() => {
      document.body.style.overflow = 'auto';
    }, CONFIG.ANIMATION_DURATION);
  }

  resetModalContent() {
    this.modalImg.classList.remove('loaded');
    this.modalVideoContainer.classList.remove('loaded');
    this.modalVideo.pause();
    this.modalVideo.src = '';
    this.modalImg.src = '';
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
    if (this.modalCounter) {
      this.modalCounter.textContent = `${this.currentIndex + 1}/${this.mediaItems.length}`;
    }
  }
}

/**
 * ========================================================================
 * PUZZLE SYSTEM CLASS
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
    const siblings = selectedOption.parentElement.querySelectorAll(`.${this.optionClass}`);
    siblings.forEach(sibling => sibling.classList.remove('selected'));
    selectedOption.classList.add('selected');
  }

  validateAnswers() {
    const section = document.getElementById(this.sectionId);
    const questions = section.querySelectorAll(`.${this.questionClass}`);
    let allCorrect = true;

    questions.forEach(question => {
      const correctIndex = parseInt(question.getAttribute('data-correct'));
      const selected = question.querySelector(`.${this.optionClass}.selected`);
      
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

    if (success) {
      successElement.style.display = 'block';
      failureElement.style.display = 'none';
      galleryElement.style.display = 'block';
      
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
      if (answer.includes(decryptedAnswer)) {
        isCorrect = true;
        break;
      }
    }

    // Check direct answers as fallback
    if (!isCorrect) {
      isCorrect = CONFIG.ACCEPTED_ANSWERS.some(validAnswer =>
        answer.includes(validAnswer)
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
    this.bonusResult.style.display = 'block';

    // Add highlight animation
    setTimeout(() => {
      this.bonusResult.classList.add('highlight-animation');
    }, 400);

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
 * GALLERY SYSTEM CLASS
 * ========================================================================
 */
class GallerySystem {
  constructor() {
    this.galleryContainer = document.getElementById('gallery-container');
    this.galleryItems = document.querySelectorAll('.gallery-item');
    
    this.initialize();
  }

  initialize() {
    this.setupMasonryLayout();
    this.handleImageLoading();
    this.setupResponsiveLayout();
  }

  setupMasonryLayout() {
    const resizeGridItems = () => {
      const rowHeight = 15; // Must match CSS grid-auto-rows
      const rowGap = 15;    // Must match CSS grid-gap

      this.galleryItems.forEach(item => {
        const imgElement = item.querySelector('img');
        if (!imgElement) return;

        if (imgElement.complete) {
          this.calculateSpan(item, imgElement, rowHeight, rowGap);
        } else {
          imgElement.addEventListener('load', () => {
            this.calculateSpan(item, imgElement, rowHeight, rowGap);
          });
        }
      });
    };

    // Initial layout
    resizeGridItems();

    // Responsive layout updates
    window.addEventListener('resize', debounce(resizeGridItems, CONFIG.DEBOUNCE_DELAY));
    window.addEventListener('load', () => {
      resizeGridItems();
      setTimeout(resizeGridItems, 1000);
    });
  }

  calculateSpan(item, imgElement, rowHeight, rowGap) {
    const height = imgElement.getBoundingClientRect().height;
    const rowSpan = Math.ceil((height + rowGap) / (rowHeight + rowGap));
    item.style.setProperty('--row-span', rowSpan);
    item.style.gridRowEnd = `span ${rowSpan}`;
  }

  handleImageLoading() {
    let loadedCount = 0;
    const totalImages = this.galleryItems.length;

    const onAllLoaded = () => {
      setTimeout(() => this.setupMasonryLayout(), 50);
      setTimeout(() => this.setupMasonryLayout(), 500);
    };

    this.galleryItems.forEach(item => {
      const img = item.querySelector('img');

      if (!img) {
        loadedCount++;
        if (loadedCount === totalImages) onAllLoaded();
        return;
      }

      if (img.complete) {
        item.classList.add('loaded');
        loadedCount++;
        if (loadedCount === totalImages) onAllLoaded();
      } else {
        img.addEventListener('load', () => {
          item.classList.add('loaded');
          loadedCount++;
          if (loadedCount === totalImages) onAllLoaded();
        });
      }
    });
  }

  setupResponsiveLayout() {
    // Handle responsive breakpoints for gallery layout
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleBreakpointChange = (e) => {
      if (e.matches) {
        // Mobile layout adjustments
        this.galleryItems.forEach(item => {
          item.style.gridColumn = '1 / -1';
          item.style.gridRow = 'span 6';
        });
      } else {
        // Desktop layout - reset to CSS defaults
        this.galleryItems.forEach(item => {
          item.style.gridColumn = '';
          item.style.gridRow = '';
        });
      }
    };

    mediaQuery.addListener(handleBreakpointChange);
    handleBreakpointChange(mediaQuery);
  }

  addGalleryImage(src, alt = '') {
    const newItem = document.createElement('div');
    newItem.className = 'gallery-item';
    newItem.setAttribute('data-type', 'image');
    newItem.setAttribute('data-src', src);

    const newImg = document.createElement('img');
    newImg.src = src;
    newImg.alt = alt || `Foto ${this.galleryItems.length + 1}`;
    newImg.className = 'gallery-img';
    newImg.setAttribute('loading', 'lazy');

    newItem.appendChild(newImg);
    this.galleryContainer.appendChild(newItem);

    // Handle loading for masonry
    newImg.addEventListener('load', () => {
      newItem.classList.add('loaded');
      this.calculateSpan(newItem, newImg, 15, 15);
    });

    return this.galleryItems.length;
  }
}

/**
 * ========================================================================
 * WEDDING COUNTER UTILITY
 * ========================================================================
 */
class WeddingCounter {
  constructor() {
    this.counter = document.getElementById('wedding-counter');
    this.startDate = new Date(CONFIG.WEDDING_DATE);
    
    if (this.counter) {
      this.start();
    }
  }

  start() {
    this.update();
    setInterval(() => this.update(), 1000);
  }

  update() {
    const now = new Date();
    const diff = new Date(now - this.startDate);
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = diff.getUTCHours();
    const minutes = diff.getUTCMinutes();
    const seconds = diff.getUTCSeconds();
    
    this.counter.textContent = `Llevan casados ${days} días, ${hours} h, ${minutes} min, ${seconds} seg.`;
  }
}

/**
 * ========================================================================
 * APPLICATION INITIALIZATION
 * ========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Wedding Counter
  new WeddingCounter();

  // Initialize Smooth Scrolling
  const scrollButton = document.getElementById('scroll-down');
  scrollButton?.addEventListener('click', () => {
    const section = document.querySelector('.section');
    window.scrollTo({
      top: section.offsetTop,
      behavior: 'smooth'
    });
  });

  // Initialize Enhanced Video Players
  const videoContainers = document.querySelectorAll('.video-player-container');
  const videoPlayers = Array.from(videoContainers).map(container => 
    new EnhancedVideoPlayer(container)
  );

  // Initialize Modal System
  const modalSystem = new ModalSystem();

  // Initialize Puzzle Systems
  const puzzle1 = new PuzzleSystem({
    sectionId: 'puzzle-section',
    checkBtnId: 'check-answers-btn',
    successId: 'puzzle-success',
    failureId: 'puzzle-failure',
    galleryId: 'secret-gallery',
    questionClass: 'puzzle-question',
    optionClass: 'question-option'
  });

  const puzzle2 = new PuzzleSystem({
    sectionId: 'puzzle-section-2',
    checkBtnId: 'check-answers-btn-2',
    successId: 'puzzle-success-2',
    failureId: 'puzzle-failure-2',
    galleryId: 'secret-gallery-2',
    questionClass: 'puzzle-question-2',
    optionClass: 'question-option-2'
  });

  // Initialize Bonus System
  const bonusSystem = new BonusSystem();

  // Initialize Gallery System
  const gallerySystem = new GallerySystem();

  // Performance monitoring
  if (window.performance && window.performance.mark) {
    window.performance.mark('app-initialized');
  }

  // Error handling
  window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
  });

  // Expose systems to global scope for debugging (development only)
  if (process?.env?.NODE_ENV === 'development') {
    window.app = {
      videoPlayers,
      modalSystem,
      puzzle1,
      puzzle2,
      bonusSystem,
      gallerySystem
    };
  }
});

/**
 * ========================================================================
 * POLYFILLS AND COMPATIBILITY
 * ========================================================================
 */

// Intersection Observer polyfill for older browsers
if (!window.IntersectionObserver) {
  console.warn('IntersectionObserver not supported, consider adding polyfill');
}

// RequestAnimationFrame polyfill
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 1000 / 60);
  };
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EnhancedVideoPlayer,
    ModalSystem,
    PuzzleSystem,
    BonusSystem,
    GallerySystem,
    WeddingCounter
  };
}