import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { FileItem } from './types';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Copies the picked file into the app's own document directory (not just the
// transient cache dir) so it's still there next time the app opens, then
// keeps the real mimeType around — that mimeType is what was missing before
// and is required for Android to know which app can open the file.
export async function pickAndStoreFile(): Promise<FileItem | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  try {
    const dir = `${FileSystem.documentDirectory}pocketbinder_files/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const dest = `${dir}${uid()}_${asset.name}`;
    await FileSystem.copyAsync({ from: asset.uri, to: dest });

    return {
      id: uid(),
      name: asset.name,
      uri: dest,
      mimeType: asset.mimeType,
      size: asset.size,
    };
  } catch (e) {
    console.error('[fileOpen] failed to store file', e);
    Alert.alert('Couldn\u2019t save file', 'Something went wrong while saving that file. Please try again.');
    return null;
  }
}

export async function openStoredFile(file: FileItem): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(file.uri);
    if (!info.exists) {
      Alert.alert('File not found', 'This file may have been removed from device storage.');
      return;
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Can\u2019t open file', 'Sharing/opening files isn\u2019t supported on this device.');
      return;
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: file.mimeType || guessMimeType(file.name),
      dialogTitle: file.name,
      UTI: Platform.OS === 'ios' ? undefined : undefined,
    });
  } catch (e) {
    console.error('[fileOpen] failed to open file', e);
    Alert.alert(
      'No app found',
      'There\u2019s no app installed on this device that can open this file type.'
    );
  }
}

function guessMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    zip: 'application/zip',
  };
  return (ext && map[ext]) || 'application/octet-stream';
}
