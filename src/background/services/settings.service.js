import { KEYS } from '../../shared/schema.js';
import { set, serialize } from '../storage.js';

export const setEnabled = (enabled) => serialize(() => set({ [KEYS.ENABLED]: enabled !== false }));
