---
title: Connect to state with URL
nav: 12
---

## Connect State with URL Hash

If you want to connect state of a store to URL hash, you can create your own hash storage.

```ts
import { create } from 'zustand'
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware'

const hashStorage: StateStorage = {
  getItem: (key): string => {
    const searchParams = new URLSearchParams(location.hash.slice(1))
    const storedValue = searchParams.get(key) ?? ''
    return JSON.parse(storedValue)
  },
  setItem: (key, newValue): void => {
    const searchParams = new URLSearchParams(location.hash.slice(1))
    searchParams.set(key, JSON.stringify(newValue))
    location.hash = searchParams.toString()
  },
  removeItem: (key): void => {
    const searchParams = new URLSearchParams(location.hash.slice(1))
    searchParams.delete(key)
    location.hash = searchParams.toString()
  },
}

export const useBoundStore = create(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage', // unique name
      storage: createJSONStorage(() => hashStorage),
    }
  )
)
```

### CodeSandbox Demo

https://codesandbox.io/s/zustand-state-with-url-hash-demo-f29b88?file=/src/store/index.ts

## Persist and Connect State with URL Parameters (Example: URL Query Parameters)

This example is for when you want to conditionally connect the state to the URL (here we use URL query parameters) when visiting the website from a populated URL, and always want it synced and consistent with something like localstorage.

If you want the URL params to always populate, the conditional check on `window.location.search.slice(1)` can be removed.

The implementation below will update the URL in place, without refresh, as the relevant states change.

```ts
import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';

const persistentStorage: StateStorage = {
    getItem: (key): string => {
        // Check URL first
        if (window.location.search.slice(1)) {
            const searchParams = new URLSearchParams(window.location.search.slice(1));
            const storedValue = searchParams.get(key);
            return JSON.parse(storedValue); // **
        } else {
            // Otherwise, we should load from localstorage or alternative storage
            return JSON.parse(localStorage.getItem(key));
        }
    },
    setItem: (key, newValue): void => {
        // Check if query params exist at all, can remove check if always want to set URL
        if (window.location.search.slice(1)) {
            const searchParams = new URLSearchParams(window.location.search.slice(1));
            searchParams.set(key, JSON.stringify(newValue)); // **
            window.history.replaceState(null, null, `?${searchParams.toString()}`);
        }

        localStorage.setItem(key, JSON.stringify(newValue));
    },
    removeItem: (key): void => {
        const searchParams = new URLSearchParams(window.location.search.slice(1));
        searchParams.delete(key);
        window.location.search = searchParams.toString();
    },
}

let localAndUrlStore = (set) => ({
    searchGameDifficulty: {
        beginner: false,
        intermediate: true,
        expert: false,
    },
    setSearchGameDifficulty: (difficulty, selection) => set((state) => ({
        searchGameDifficulty: {...state.searchGameDifficulty, [difficulty]: selection}
    })),

    searchRatings: {
        1: false,
        2: false,
        3: false,
        4: true,
        5: true
    },
    setSearchRatings: (rating, selection) => set((state) => ({
        searchRatings: {...state.searchRatings, [rating]: selection}
    })),
});

let storageOptions = {
    name: "gameSearchPreferences",
    storage: persistentStorage,
};

const useLocalAndUrlStore = create(
    persist(
        devtools(localAndUrlStore),
        storageOptions
    )
);

export default localAndUrlStore;
```

When generating the URL from a component, you can call buildShareableUrl:

```ts
const buildURLSuffix = (params, version = 0) => {
    const searchParams = new URLSearchParams();

    const zustandStoreParams = {
        "state":{
            searchGameDifficulty: params.searchGameDifficulty,
            searchRatings: params.searchRatings,
        }, 
        "version": version // version is here because that is included with how Zustand sets the state
    };

    // The URL param key should match the name of the store, as specified as in storageOptions above
    searchParams.set("gameSearchPreferences", JSON.stringify(zustandStoreParams)); // **
    return searchParams.toString();
};

export const buildShareableUrl = (params, version) => {
    return `${window.location.origin}?${buildURLSuffix(params, version)}`;
}
```

The generated URL would look like (here without any encoding, for readability):

https://localhost/search?gameSearchPreferences={"state":{"searchGameDifficulty":{"beginner":false,"intermediate":true,"expert":false},"searchRatings":{"1":false,"2":false,"3":false,"4":true,"5":true}},"version":0}}
>>>>>>> 3f67f7a (docs: persist and connect state with url)
