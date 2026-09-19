import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConfirmModal, CourseFormModal } from '../../components/Modals';
import { Card, EmptyState, FAB, IconButton, ScreenHeader } from '../../components/UI';
import { useLiveData } from '../../lib/hooks';
import { CoursesStore } from '../../lib/storage';
import { COLORS, FONT, RADIUS, SPACING } from '../../lib/theme';
import { CourseItem } from '../../lib/types';

export default function CoursesListScreen() {
  const { data: courses, reload } = useLiveData('courses', CoursesStore.getAll, [] as CourseItem[]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleSave(data: Pick<CourseItem, 'code' | 'instructorName' | 'instructorEmail' | 'roomLocation'>) {
    if (editing) {
      await CoursesStore.update(editing.id, data);
    } else {
      await CoursesStore.add({ ...data, files: [], links: [], todos: [] });
    }
    setFormOpen(false);
    setEditing(null);
    reload();
  }

  async function handleDelete() {
    if (confirmDeleteId) await CoursesStore.remove(confirmDeleteId);
    setConfirmDeleteId(null);
    reload();
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Courses" subtitle={`${courses.length} course${courses.length === 1 ? '' : 's'}`} />
      <FlatList
        data={courses}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon="book-outline" text="No courses yet. Tap + to add your first one." />}
        renderItem={({ item }) => {
          const pendingTodos = item.todos.filter((t) => t.status === 'ongoing').length;
          return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/courses/${item.id}`)}>
              <Card style={{ marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.badge, { backgroundColor: COLORS.primarySoft }]}>
                  <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{item.code.slice(0, 4).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={FONT.h3}>{item.code}</Text>
                  {!!item.instructorName && <Text style={FONT.bodyMuted}>{item.instructorName}</Text>}
                  {pendingTodos > 0 && (
                    <Text style={[FONT.bodyMuted, { color: COLORS.primary, marginTop: 2 }]}>{pendingTodos} to-do{pendingTodos === 1 ? '' : 's'}</Text>
                  )}
                </View>
                <IconButton
                  name="create-outline"
                  onPress={() => { setEditing(item); setFormOpen(true); }}
                  bg={COLORS.surfaceAlt}
                  size={16}
                />
                <View style={{ width: 8 }} />
                <IconButton
                  name="trash-outline"
                  onPress={() => setConfirmDeleteId(item.id)}
                  bg={COLORS.dangerSoft}
                  color={COLORS.danger}
                  size={16}
                />
                <Ionicons name="chevron-forward" size={18} color={COLORS.textFaint} style={{ marginLeft: 6 }} />
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      <FAB onPress={() => { setEditing(null); setFormOpen(true); }} />

      <CourseFormModal
        visible={formOpen}
        initial={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
      />
      <ConfirmModal
        visible={!!confirmDeleteId}
        title="Delete course?"
        message="This will also remove its to-dos, files, and links."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  badge: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
