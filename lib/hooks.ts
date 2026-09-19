import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SettingsStore, StoreKey, subscribe } from './storage';
import { UserSettings, WEEKDAYS, Weekday } from './types';

/**
 * Keeps a screen's local copy of a store in sync automatically:
 * - reloads when the tab/screen comes into focus
 * - reloads instantly when ANY screen mutates that store while this one
 *   is mounted (add/edit/delete elsewhere reflects here without navigating)
 *
 * This is what satisfies "sync all pages + auto refresh after every CRUD op"
 * without needing a full global state library.
 */
export function useLiveData<T>(key: StoreKey, loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const fresh = await loader();
    setData(fresh);
    setLoading(false);
  }, [loader]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    const unsubscribe = subscribe(key, reload);
    return unsubscribe;
  }, [key, reload]);

  return { data, setData, loading, reload };
}

const DEFAULT_SETTINGS: UserSettings = { username: 'Student', accentColor: '#FF5C7A', weekStartsMonday: false };

// Centralizes the settings read so every screen that cares about
// weekStartsMonday / accentColor reacts the same way, instead of each
// screen guessing at its own default.
export function useSettings() {
  return useLiveData('settings', SettingsStore.get, DEFAULT_SETTINGS);
}

// Returns the 7 weekdays in display order, honoring the
// "week starts on Monday" preference.
export function orderedWeekdays(weekStartsMonday: boolean): Weekday[] {
  if (!weekStartsMonday) return [...WEEKDAYS];
  return [...WEEKDAYS.slice(1), WEEKDAYS[0]];
}
