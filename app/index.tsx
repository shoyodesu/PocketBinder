import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDateLabel } from '../components/CustomPickers';
import { IdEditModal } from '../components/Modals';
import { Card, EmptyState, IconButton, Pill, ScreenHeader, SectionLabel } from '../components/UI';
import { useLiveData } from '../lib/hooks';
import { CoursesStore, EventsStore, SettingsStore, StudentIdStore } from '../lib/storage';
import { COLORS, FONT, RADIUS, SPACING, STICKER_SHADOW } from '../lib/theme';
import { StudentIdData, UserSettings } from '../lib/types';

const EMPTY_ID: StudentIdData = { name: '', birthday: '', school: '', year: '', color: COLORS.primary, photo: null };
const EMPTY_SETTINGS: UserSettings = { username: 'Student', accentColor: COLORS.primary, weekStartsMonday: false };

export default function HomeScreen() {
  const { data: studentId, reload: reloadId } = useLiveData('studentId', StudentIdStore.get, EMPTY_ID);
  const { data: settings } = useLiveData('settings', SettingsStore.get, EMPTY_SETTINGS);
  const { data: courses } = useLiveData('courses', CoursesStore.getAll, []);
  const { data: events } = useLiveData('events', EventsStore.getAll, []);
  const [editOpen, setEditOpen] = useState(false);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.length) {
      const updated = { ...studentId, photo: result.assets[0].uri };
      await StudentIdStore.save(updated);
      reloadId();
    }
  }

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const fromEvents = events
      .filter((e) => e.date >= today)
      .map((e) => ({ id: e.id, title: e.title, date: e.date, sub: e.category }));
    const fromTodos = courses.flatMap((c) =>
      c.todos
        .filter((t) => t.hasDeadline && t.deadlineDate && t.deadlineDate >= today && t.status !== 'completed')
        .map((t) => ({ id: t.id, title: t.title, date: t.deadlineDate as string, sub: c.code }))
    );
    return [...fromEvents, ...fromTodos].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [events, courses]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader title={`Hi, ${settings.username}`} subtitle="Here's your PocketBinder overview" />

      <View style={{ paddingHorizontal: SPACING.lg }}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setEditOpen(true)}>
          <View style={[styles.idCard, { backgroundColor: studentId.color || COLORS.primary }, STICKER_SHADOW]}>
            <View style={styles.idCardTop}>
              <Text style={styles.idCardBrand}>POCKETBINDER</Text>
              <IconButton name="create-outline" onPress={() => setEditOpen(true)} bg="rgba(255,255,255,0.25)" color="#FFF" size={16} />
            </View>
            <View style={styles.idCardBody}>
              <TouchableOpacity onPress={pickPhoto} style={styles.avatar}>
                {studentId.photo ? (
                  <Image source={{ uri: studentId.photo }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={30} color="rgba(255,255,255,0.85)" />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.idName}>{studentId.name || 'Your Name'}</Text>
                {!!studentId.school && <Text style={styles.idSub}>{studentId.school}</Text>}
                {!!studentId.year && <Text style={styles.idSub}>{studentId.year}</Text>}
                {!!studentId.birthday && (
              <Text style={styles.idBirthday}>{formatDateLabel(studentId.birthday)}</Text>
            )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <SectionLabel>UPCOMING</SectionLabel>
        <Card>
          {upcoming.length === 0 ? (
            <EmptyState icon="checkmark-done-circle-outline" text="Nothing coming up. You're all caught up!" />
          ) : (
            upcoming.map((item, i) => (
              <View key={item.id} style={[styles.upcomingRow, i > 0 && styles.upcomingDivider]}>
                <View style={{ flex: 1 }}>
                  <Text style={FONT.body}>{item.title}</Text>
                  <Text style={FONT.bodyMuted}>{item.sub}</Text>
                </View>
                <Pill label={formatDateLabel(item.date)} color={COLORS.secondary} />
              </View>
            ))
          )}
        </Card>
      </View>

      <IdEditModal
        visible={editOpen}
        initial={studentId}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => {
          await StudentIdStore.save(data);
          setEditOpen(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  idCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  idCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idCardBrand: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
    marginLeft: 10,
  },
  idCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 110, height: 110 },
  idName: { color: '#FFF', fontSize: 19, fontWeight: '800' },
  idSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  idBirthday: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 2},
  upcomingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  upcomingDivider: { borderTopWidth: 1, borderTopColor: COLORS.divider },
});
