/**
 * Personal Website - Enhanced JavaScript
 * Theme Toggle, Accessibility Features, and Performance Optimizations
 */

// ===================================
// CONSTANTS & CONFIGURATION
// ===================================
const CONFIG = {
  THEME_KEY: "preferred-theme",
  THEME_LIGHT: "light",
  THEME_DARK: "dark",
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 150,
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Debounce function to limit rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safe local storage wrapper with error handling
 */
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("LocalStorage not available:", error);
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("LocalStorage not available:", error);
      return false;
    }
  },
};

// ===================================
// THEME MANAGEMENT
// ===================================
class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById("theme-toggle");
    this.body = document.body;
    this.currentTheme = this.getInitialTheme();

    this.init();
  }

  /**
   * Get initial theme from localStorage or system preference
   * @returns {string} Theme name
   */
  getInitialTheme() {
    // Check localStorage first
    const savedTheme = storage.get(CONFIG.THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      return CONFIG.THEME_LIGHT;
    }

    return CONFIG.THEME_DARK;
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Apply initial theme
    this.applyTheme(this.currentTheme, false);

    // Set up event listeners
    this.setupEventListeners();

    // Listen for system theme changes
    this.watchSystemTheme();

    // Announce theme on load for screen readers
    this.announceTheme();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (!this.themeToggle) {
      console.warn("Theme toggle button not found");
      return;
    }

    this.themeToggle.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Keyboard accessibility
    this.themeToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme =
      this.currentTheme === CONFIG.THEME_LIGHT
        ? CONFIG.THEME_DARK
        : CONFIG.THEME_LIGHT;

    this.applyTheme(newTheme, true);
  }

  /**
   * Apply theme to document
   * @param {string} theme - Theme name
   * @param {boolean} animate - Whether to animate the transition
   */
  applyTheme(theme, animate = true) {
    this.currentTheme = theme;

    // Add/remove light theme class
    if (theme === CONFIG.THEME_LIGHT) {
      this.body.classList.add("light-theme");
    } else {
      this.body.classList.remove("light-theme");
    }

    // Save to localStorage
    storage.set(CONFIG.THEME_KEY, theme);

    // Update meta theme-color
    this.updateMetaTheme(theme);

    // Announce change to screen readers
    if (animate) {
      this.announceTheme();
    }

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme },
      }),
    );
  }

  /**
   * Update meta theme-color for mobile browsers
   * @param {string} theme - Theme name
   */
  updateMetaTheme(theme) {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        theme === CONFIG.THEME_LIGHT ? "#f8f9fa" : "#0a0e13",
      );
    }
  }

  /**
   * Announce theme change to screen readers
   */
  announceTheme() {
    const announcement = `Theme switched to ${this.currentTheme} mode`;

    // Create or update aria-live region
    let announcer = document.getElementById("theme-announcer");
    if (!announcer) {
      announcer = document.createElement("div");
      announcer.id = "theme-announcer";
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      announcer.className = "sr-only";
      announcer.style.cssText =
        "position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;";
      document.body.appendChild(announcer);
    }

    announcer.textContent = announcement;
  }

  /**
   * Watch for system theme changes
   */
  watchSystemTheme() {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = storage.get(CONFIG.THEME_KEY);
      if (!savedTheme) {
        this.applyTheme(
          e.matches ? CONFIG.THEME_LIGHT : CONFIG.THEME_DARK,
          false,
        );
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
  }
}

// ===================================
// PERFORMANCE OPTIMIZATIONS
// ===================================

/**
 * Lazy load images
 */
function setupLazyLoading() {
  if ("loading" in HTMLImageElement.prototype) {
    // Native lazy loading supported
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      img.src = img.dataset.src || img.src;
    });
  } else {
    // Fallback to Intersection Observer
    const images = document.querySelectorAll('img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.removeAttribute("loading");
          observer.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }
}

/**
 * Optimize animations based on network conditions
 */
function optimizeForConnection() {
  if ("connection" in navigator) {
    const connection = navigator.connection;

    // Reduce animations on slow connections
    if (
      connection.saveData ||
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g"
    ) {
      document.documentElement.classList.add("reduced-motion");
    }
  }
}

// ===================================
// FOOTER YEAR
// ===================================

/**
 * Update copyright year automatically
 */
function updateCopyrightYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// ===================================
// ANALYTICS & TRACKING (Optional)
// ===================================

/**
 * Track external link clicks
 */
function setupAnalytics() {
  const externalLinks = document.querySelectorAll('a[target="_blank"]');

  externalLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.href;
      const text = this.textContent.trim();

      // Send to analytics (if you have analytics setup)
      if (typeof gtag !== "undefined") {
        gtag("event", "click", {
          event_category: "outbound",
          event_label: href,
          transport_type: "beacon",
        });
      }

      // Console log for debugging
      console.log("External link clicked:", { href, text });
    });
  });
}

// ===================================
// ACCESSIBILITY ENHANCEMENTS
// ===================================

/**
 * Improve keyboard navigation
 */
function enhanceKeyboardNavigation() {
  // Add visible focus indicators
  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      document.body.classList.add("keyboard-nav");
    }
  });

  document.addEventListener("mousedown", function () {
    document.body.classList.remove("keyboard-nav");
  });
}

/**
 * Add skip to main content link for screen readers
 */
function addSkipLink() {
  const skipLink = document.createElement("a");
  skipLink.href = "#main";
  skipLink.textContent = "Skip to main content";
  skipLink.className = "skip-link";
  skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--color-primary);
        color: white;
        padding: 8px;
        text-decoration: none;
        z-index: 100;
    `;

  skipLink.addEventListener("focus", function () {
    this.style.top = "0";
  });

  skipLink.addEventListener("blur", function () {
    this.style.top = "-40px";
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
}

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler
 */
window.addEventListener("error", function (e) {
  console.error("Global error:", e.error);
  // You can send errors to a logging service here
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener("unhandledrejection", function (e) {
  console.error("Unhandled promise rejection:", e.reason);
});

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize all features when DOM is ready
 */
function init() {
  try {
    // Core functionality
    new ThemeManager();
    updateCopyrightYear();

    // Performance optimizations
    setupLazyLoading();
    optimizeForConnection();

    // Accessibility
    enhanceKeyboardNavigation();
    addSkipLink();

    // Analytics (optional)
    setupAnalytics();

    // Remove loading class if exists
    document.body.classList.remove("loading");

    console.log("✅ Website initialized successfully");
  } catch (error) {
    console.error("❌ Initialization error:", error);
  }
}

// Run initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Export for testing (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ThemeManager,
    CONFIG,
    debounce,
  };
}
