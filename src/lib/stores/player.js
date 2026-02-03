import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'yahtzee_player';

function createPlayerStore() {
  // Try to restore from localStorage
  const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
  const initial = stored ? JSON.parse(stored) : { id: null, name: '' };
  
  const { subscribe, set, update } = writable(initial);
  
  return {
    subscribe,
    set: (value) => {
      if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      }
      set(value);
    },
    update,
    setName: (name) => {
      update(p => {
        const newValue = { ...p, name };
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
        }
        return newValue;
      });
    },
    setId: (id) => {
      update(p => {
        const newValue = { ...p, id };
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
        }
        return newValue;
      });
    },
    clear: () => {
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
      }
      set({ id: null, name: '' });
    }
  };
}

export const player = createPlayerStore();
