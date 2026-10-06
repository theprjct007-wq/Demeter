// MAIN world, document_start: patch fetch/XHR before the app's own JS runs.
import { listenForRules } from './state.js';
import { patchFetch } from './fetch-patch.js';
import { patchXHR } from './xhr-patch.js';

listenForRules();
patchFetch();
patchXHR();
