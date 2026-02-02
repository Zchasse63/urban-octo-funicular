/**
 * Analytics utility module for PodBrain
 * Placeholder implementation - replace with GA4 or Plausible before launch
 */

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export const analytics = {
  /**
   * Track a pageview
   * @param url - The page URL being viewed
   */
  pageview: (url: string): void => {
    if (typeof window !== 'undefined') {
      console.log('[Analytics] Pageview:', url);

      // Future: Google Analytics 4
      // if (window.gtag) {
      //   window.gtag('event', 'page_view', {
      //     page_path: url,
      //     page_title: document.title,
      //   });
      // }

      // Future: Plausible Analytics
      // if (window.plausible) {
      //   window.plausible('pageview');
      // }
    }
  },

  /**
   * Track a custom event
   * @param name - Event name (e.g., 'episode_uploaded', 'subscription_started')
   * @param properties - Additional event properties
   */
  event: (name: string, properties?: Record<string, unknown>): void => {
    if (typeof window !== 'undefined') {
      console.log('[Analytics] Event:', name, properties);

      // Future: Google Analytics 4
      // if (window.gtag) {
      //   window.gtag('event', name, properties);
      // }

      // Future: Plausible Analytics
      // if (window.plausible) {
      //   window.plausible(name, { props: properties });
      // }
    }
  },

  /**
   * Identify a user (for authenticated analytics)
   * @param userId - The user ID
   * @param traits - User properties
   */
  identify: (userId: string, traits?: Record<string, unknown>): void => {
    if (typeof window !== 'undefined') {
      console.log('[Analytics] Identify:', userId, traits);

      // Future: Set user ID in GA4
      // if (window.gtag) {
      //   window.gtag('config', 'GA_MEASUREMENT_ID', {
      //     user_id: userId,
      //   });
      // }
    }
  },
};

// Type augmentation for window object (uncomment when implementing real analytics)
// declare global {
//   interface Window {
//     gtag?: (...args: unknown[]) => void;
//     plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
//   }
// }
