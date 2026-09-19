import { Alert, Linking } from 'react-native';

// Android's Linking.openURL requires a full scheme — a saved link like
// "cvsu.edu.ph" fails with "No Activity found to handle Intent" because
// there's no scheme for Android to route. This normalizes on save AND
// defensively again on open.
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed; // already has a scheme
  return `https://${trimmed}`;
}

export async function openLink(rawUrl: string): Promise<void> {
  const url = normalizeUrl(rawUrl);
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Can\u2019t open link', 'No app on this device can open this link.');
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    console.error('[links] failed to open', e);
    Alert.alert('Can\u2019t open link', 'Something went wrong trying to open this link.');
  }
}
