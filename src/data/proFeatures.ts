/**
 * 3D Studio Pro — a paid add-on by DALI STUDIO.
 *
 * While `unlocked` is false the screen runs as a limited demo so ELSARAYA can try it:
 * a DEMO watermark, a limited number of timed sessions, and no saving.
 * When the client buys it, DALI STUDIO sets `unlocked: true` and deploys.
 * (The demo limits live in the browser, so they deter casual use; they are not a security lock.)
 */
export const PRO_3D = {
  unlocked: false,
  /** Number of demo sessions each browser gets. */
  demoSessions: 5,
  /** Length of one demo session in minutes. */
  demoMinutes: 10,
  contactUrl: 'https://instagram.com/dalistudioeg',
  contactLabel: '@dalistudioeg',
};

export const PRO_3D_STORAGE_KEY = 'saraya-3d-studio-pro-demo-v1';
