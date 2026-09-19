import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmModal } from '../components/Modals';
import { Button, Card, ColorSwatchPicker, FieldLabel, ScreenHeader, SectionLabel, SwitchRow, TextField } from '../components/UI';
import { useLiveData } from '../lib/hooks';
import { clearAllData, exportAllData, importAllData, SettingsStore } from '../lib/storage';
import { COLORS, FONT, SPACING, SWATCHES } from '../lib/theme';
import { UserSettings } from '../lib/types';

const EMPTY: UserSettings = { username: 'Student', accentColor: COLORS.primary, weekStartsMonday: false };

export default function SettingsScreen() {
  const { data: settings, reload } = useLiveData('settings', SettingsStore.get, EMPTY);
  const [draft, setDraft] = useState(settings);
  const [confirmClear, setConfirmClear] = useState(false);

  // Settings is the one screen where "live" editing before Save is fine to
  // mirror locally, but we still only persist (and only then does it affect
  // other screens) once Save Preferences is tapped.
  useEffect(() => setDraft(settings), [settings]);

  async function save() {
    await SettingsStore.save(draft);
    reload();
    Alert.alert('Saved', 'Your preferences were updated.');
  }

  async function handleExport() {
    try {
      const json = await exportAllData();
      const path = `${FileSystem.cacheDirectory}pocketbinder_backup.json`;
      await FileSystem.writeAsStringAsync(path, json);
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'PocketBinder Backup' });
      } else {
        Alert.alert('Backup ready', `Saved to ${path}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Export failed', 'Could not create a backup file.');
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets?.length) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      await importAllData(content);
      reload();
      Alert.alert('Import complete', 'Your data has been restored.');
    } catch (e) {
      console.error(e);
      Alert.alert('Import failed', 'That file could not be read as a PocketBinder backup.');
    }
  }

  async function handleClear() {
    await clearAllData();
    setConfirmClear(false);
    reload();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <ScreenHeader title="Settings" />

      <View style={{ paddingHorizontal: SPACING.lg }}>
        <SectionLabel>PROFILE</SectionLabel>
        <Card>
          <FieldLabel>Display name</FieldLabel>
          <TextField value={draft.username} onChangeText={(v) => setDraft({ ...draft, username: v })} placeholder="Your name" />
          <View style={{ height: SPACING.lg }} />
          <FieldLabel>Accent color</FieldLabel>
          <ColorSwatchPicker value={draft.accentColor} options={SWATCHES} onSelect={(c) => setDraft({ ...draft, accentColor: c })} />
        </Card>

        <SectionLabel>PREFERENCES</SectionLabel>
        <Card compact>
          <SwitchRow label="Week starts on Monday" value={draft.weekStartsMonday} onChange={(v) => setDraft({ ...draft, weekStartsMonday: v })} />
          <Button label="Save Preferences" onPress={save} full />
        </Card>



        <SectionLabel>BACKUP</SectionLabel>
        <Card>
          <Text style={[FONT.bodyMuted, { marginBottom: SPACING.md }]}>
            Export all your courses, schedule, calendar events, and ID as a single backup file, or restore from one.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Export" variant="secondary" icon="download-outline" onPress={handleExport} full />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Import" variant="secondary" icon="cloud-upload-outline" onPress={handleImport} full />
            </View>
          </View>
        </Card>

        <SectionLabel>DANGER ZONE</SectionLabel>
        <Card>
          <Text style={[FONT.bodyMuted, { marginBottom: SPACING.md }]}>
            Permanently delete every course, schedule, event, and your ID card from this device.
          </Text>
          <Button label="Clear All Data" variant="danger" onPress={() => setConfirmClear(true)} full />
        </Card>

        <SectionLabel>ABOUT</SectionLabel>
        <Card>
          <Text style={FONT.body}>PocketBinder</Text>
          <Text style={FONT.bodyMuted}>Version 2.0.0</Text>
        </Card>
      </View>

      <ConfirmModal
        visible={confirmClear}
        title="Clear all data?"
        message="This permanently deletes everything stored in PocketBinder on this device. This cannot be undone."
        confirmLabel="Delete Everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={handleClear}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
});
