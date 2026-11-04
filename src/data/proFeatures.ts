/**
 * 3D Studio Pro — a paid add-on by DALI STUDIO.
 *
 * While `unlocked` is false the screen runs as a limited demo so ELSARAYA can try it:
 * a DEMO watermark, a limited number of timed sessions, and no saving.
 * When the client pays, they get an activation key and enter it on the screen ("Activate subscription").
 * Only the SHA-256 hash of the key is stored here, so the key itself is not in the code.
 *
 * To issue a new key: pick any key (e.g. ABCD-EFGH-JKLM-NPQR), hash it
 *   node -e "console.log(require('crypto').createHash('sha256').update('ABCD-EFGH-JKLM-NPQR').digest('hex'))"
 * and paste the hash into `activationKeyHash`. Keys are checked in upper case with spaces removed.
 * Setting `unlocked: true` unlocks it for everyone without a key.
 * (Everything runs in the browser, so this deters casual use; it is not a server-side licence check.)
 */
export const PRO_3D = {
  unlocked: false,
  /** Number of demo sessions each browser gets. */
  demoSessions: 5,
  /** Length of one demo session in minutes. */
  demoMinutes: 10,
  /** One-time activation price shown on the screen. */
  priceUsd: 250,
  /** SHA-256 (hex) of the activation key that unlocks Pro. */
  activationKeyHash: '759ef33584462ed04d8df69621cb72a94e43fa1157dd9d2de44c77edfb19d2f4',
  /** Optional checkout link shown under the key field. Leave empty until there is one. */
  paymentUrl: '',
};

export const PRO_3D_STORAGE_KEY = 'saraya-3d-studio-pro-demo-v1';
/** Where an accepted key's hash is remembered on this browser. */
export const PRO_3D_LICENSE_KEY = 'saraya-3d-studio-pro-license-v1';

export const normalizeProKey = (key: string) => key.toUpperCase().replace(/\s+/g, '');

export const hashProKey = async (key: string) => {
  const bytes = new TextEncoder().encode(normalizeProKey(key));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
};

export const isProLicensed = () => {
  if (PRO_3D.unlocked) return true;
  try { return window.localStorage.getItem(PRO_3D_LICENSE_KEY) === PRO_3D.activationKeyHash; } catch { return false; }
};

/**
 * Client proposals (Export proposal) — a paid add-on by DALI STUDIO.
 *
 * While `unlocked` is false every proposal is a demo: each page carries a DEMO mark.
 * Entering the activation key on the proposal screen removes the mark on this browser.
 * Keys work like the 3D Studio Pro key above: only the SHA-256 hash is kept here.
 */
export const PROPOSAL_PRO = {
  unlocked: false,
  activationKeyHash: '389b3691f2ed1d8bce32e930ec80190b278ad6b0ae792d348173d108578195e2',
};

export const PROPOSAL_LICENSE_KEY = 'saraya-proposal-license-v1';

export const isProposalLicensed = () => {
  if (PROPOSAL_PRO.unlocked) return true;
  try { return window.localStorage.getItem(PROPOSAL_LICENSE_KEY) === PROPOSAL_PRO.activationKeyHash; } catch { return false; }
};
