/**
 * Toast notification manager for ChyperAI
 * Re-exports the toastManager from errorHandling.js for consistency
 */

import { toastManager } from './errorHandling';

export default toastManager;

// Also export individually for named imports
export { toastManager };