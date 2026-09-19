import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { FileItem } from './types';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Convert ArrayBuffer to Base64 in JS engine (no native module read calls)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function pickAndStoreFile(): Promise<FileItem | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];

    const safeFileName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const persistentUri = `${FileSystem.documentDirectory}${Date.now()}_${safeFileName}`;

    // ROCKET FIX: Use JS native fetch() to stream the content:// or file:// URI into memory
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    // Convert Blob -> ArrayBuffer -> Base64 inside JavaScript
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Strip data URL prefix if present (e.g. "data:application/pdf;base64,")
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Write persistent copy directly into private app storage
    await FileSystem.writeAsStringAsync(persistentUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      id: uid(),
      name: asset.name,
      uri: persistentUri,
      mimeType: asset.mimeType || guessMimeType(asset.name),
      size: asset.size,
    };
  } catch (e) {
    console.error('[fileOpen] Pick failed:', e);
    Alert.alert('Upload Failed', 'Could not save the selected file to internal storage.');
    return null;
  }
}

export async function openStoredFile(file: FileItem): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(file.uri);
    if (!fileInfo.exists) {
      Alert.alert(
        'File Missing',
        'This file reference is broken or deleted. Please remove and re-upload it.'
      );
      return;
    }

    const mime = file.mimeType || guessMimeType(file.name);

    if (Platform.OS === 'android') {
      // Get Android FileProvider content:// URI for our saved persistent file
      const contentUri = await FileSystem.getContentUriAsync(file.uri);

      // Open via Android Intent
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: mime,
      });
    } else {
      await Sharing.shareAsync(file.uri, {
        mimeType: mime,
        dialogTitle: file.name,
      });
    }
  } catch (e) {
    console.error('[fileOpen] Open failed:', e);
    Alert.alert(
      'No App Found',
      'No compatible app is installed to open this file format.'
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