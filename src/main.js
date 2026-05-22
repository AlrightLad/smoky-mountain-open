/* ── The Parbaughs — Vite Entry Point ──
   FIRST: error handler (Sentry) — must hook globals before any other code runs
   THEN: CSS imports
   JS bootstrap happens via concatenated CORE_FILES (see vite.config.js).
*/

// FIRST: initialize Sentry. This MUST be the first import so global error
// handlers are installed before Firebase init or any other module can throw.
// Runtime-safe: no-ops cleanly if VITE_SENTRY_DSN is missing or malformed.
import { initSentry } from './core/errorHandler.js';
initSentry();

import './styles/base.css';
import './styles/components.css';
