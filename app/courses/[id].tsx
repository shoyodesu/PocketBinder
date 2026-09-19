import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDateLabel } from '../../components/CustomPickers';
import { ConfirmModal, CourseFormModal, LinkFormModal, TodoFormModal } from '../../components/Modals';
import { Card, EmptyState, FAB, IconButton, Pill } from '../../components/UI';
import { useAccent } from '../../lib/AccentContext';
import { openStoredFile, pickAndStoreFile } from '../../lib/fileOpen';
import { useLiveData } from '../../lib/hooks';
import { openLink } from '../../lib/links';
import { CoursesStore, TodosStore } from '../../lib/storage';
import { COLORS, FONT, RADIUS, SPACING } from '../../lib/theme';
import { CourseItem, FileItem, LinkItem, TodoItem } from '../../lib/types';

const STATUS_COLOR: Record<TodoItem['status'], string> = {
  ongoing: COLORS.accentBlue,
  completed: COLORS.accentGreen,
  missed: COLORS.danger,
};

type Tab = 'todos' | 'files' | 'links';

export default function CourseDetailScreen() {
  const accent = useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: courses, reload } = useLiveData('courses', CoursesStore.getAll, [] as CourseItem[]);
  const { data: allTodos, reload: reloadTodos } = useLiveData('todos', TodosStore.getAll, [] as TodoItem[]);
  const course = useMemo(() => courses.find((c) => c.id === id), [courses, id]);
  const courseTodos = useMemo(() => allTodos.filter((t) => t.courseId === id), [allTodos, id]);

  const [tab, setTab] = useState<Tab>('todos');
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [todoModal, setTodoModal] = useState<{ open: boolean; item: TodoItem | null }>({ open: false, item: null });
  const [linkModal, setLinkModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'todo' | 'file' | 'link'; id: string } | null>(null);

  if (!course) {
    return (
      <View style={styles.container}>
        <EmptyState icon="alert-circle-outline" text="This course was deleted or no longer exists." />
      </View>
    );
  }

  async function patchCourse(patch: Partial<CourseItem>) {
    await CoursesStore.update(course!.id, patch);
    reload();
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.length) {
      await patchCourse({ profilePhoto: result.assets[0].uri });
    }
  }

  async function saveTodo(data: Omit<TodoItem, 'id'>) {
    if (todoModal.item) {
      await TodosStore.update(todoModal.item.id, data);
    } else {
      await TodosStore.add(data);
    }
    setTodoModal({ open: false, item: null });
    reloadTodos();
  }

  async function saveLink(data: { title: string; url: string }) {
    const links: LinkItem[] = [...course!.links, { ...data, id: `${Date.now()}` }];
    await patchCourse({ links });
    setLinkModal(false);
  }

  async function addFile() {
    const file = await pickAndStoreFile();
    if (file) await patchCourse({ files: [...course!.files, file] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'todo') {
      await TodosStore.remove(deleteTarget.id);
      reloadTodos();
    } else if (deleteTarget.type === 'file') {
      await patchCourse({ files: course!.files.filter((f: FileItem) => f.id !== deleteTarget.id) });
    } else {
      await patchCourse({ links: course!.links.filter((l) => l.id !== deleteTarget.id) });
    }
    setDeleteTarget(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <IconButton name="create-outline" onPress={() => setEditCourseOpen(true)} />
      </View>

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={pickPhoto} style={styles.avatar}>
          {course.profilePhoto ? (
            <Image source={{ uri: course.profilePhoto }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="camera-outline" size={22} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={FONT.title}>{course.code}</Text>
          {!!course.instructorName && <Text style={FONT.bodyMuted}>{course.instructorName}</Text>}
        </View>
      </View>

      {(course.instructorEmail || course.roomLocation) ? (
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <Card compact>
            {!!course.instructorEmail && <InfoRow icon="mail-outline" text={course.instructorEmail} />}
            {!!course.roomLocation && <InfoRow icon="location-outline" text={course.roomLocation} />}
          </Card>
        </View>
      ) : null}

      {/* Pill tabs instead of stacking everything in one scroll — this is
          the fix for having to scroll past a long to-do list just to reach
          Files or Links. */}
      <View style={styles.tabTrack}>
        {(['todos', 'files', 'links'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && { backgroundColor: accent }]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[FONT.h3, { fontSize: 13, color: tab === t ? '#FFF' : COLORS.textMuted }]}>
              {t === 'todos' ? 'To-dos' : t === 'files' ? 'Files' : 'Links'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>
        {tab === 'todos' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={FONT.bodyMuted}>{courseTodos.length} to-do{courseTodos.length === 1 ? '' : 's'}</Text>
            </View>
            {courseTodos.length === 0 ? (
              <EmptyState icon="checkbox-outline" text="No to-dos for this course yet." />
            ) : (
              courseTodos.map((t) => (
                <Card key={t.id} style={{ marginBottom: SPACING.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={FONT.h3}>{t.title}</Text>
                      {!!t.description && <Text style={[FONT.bodyMuted, { marginTop: 2 }]}>{t.description}</Text>}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <Pill label={t.status} color={STATUS_COLOR[t.status]} />
                        {t.hasDeadline && t.deadlineDate && <Pill label={formatDateLabel(t.deadlineDate)} color={COLORS.secondary} />}
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <IconButton name="create-outline" size={15} onPress={() => setTodoModal({ open: true, item: t })} />
                      <IconButton name="trash-outline" size={15} color={COLORS.danger} bg={COLORS.dangerSoft} onPress={() => setDeleteTarget({ type: 'todo', id: t.id })} />
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'files' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={FONT.bodyMuted}>{course.files.length} file{course.files.length === 1 ? '' : 's'}</Text>
            </View>
            {course.files.length === 0 ? (
              <EmptyState icon="document-outline" text="No files attached yet." />
            ) : (
              course.files.map((f) => (
                <Card key={f.id} style={{ marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="document-attach-outline" size={20} color={COLORS.secondary} />
                  <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => openStoredFile(f)}>
                    <Text style={FONT.body} numberOfLines={1}>{f.name}</Text>
                    <Text style={FONT.bodyMuted}>Tap to open</Text>
                  </TouchableOpacity>
                  <IconButton name="trash-outline" size={15} color={COLORS.danger} bg={COLORS.dangerSoft} onPress={() => setDeleteTarget({ type: 'file', id: f.id })} />
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'links' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={FONT.bodyMuted}>{course.links.length} link{course.links.length === 1 ? '' : 's'}</Text>
            </View>
            {course.links.length === 0 ? (
              <EmptyState icon="link-outline" text="No links added yet." />
            ) : (
              course.links.map((l) => (
                <Card key={l.id} style={{ marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="link-outline" size={20} color={COLORS.secondary} />
                  <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => openLink(l.url)}>
                    <Text style={FONT.body} numberOfLines={1}>{l.title}</Text>
                    <Text style={FONT.bodyMuted} numberOfLines={1}>{l.url}</Text>
                  </TouchableOpacity>
                  <IconButton name="trash-outline" size={15} color={COLORS.danger} bg={COLORS.dangerSoft} onPress={() => setDeleteTarget({ type: 'link', id: l.id })} />
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>

      <FAB
        onPress={() => {
          if (tab === 'todos') setTodoModal({ open: true, item: null });
          else if (tab === 'files') addFile();
          else setLinkModal(true);
        }}
      />

      <CourseFormModal
        visible={editCourseOpen}
        initial={course}
        onClose={() => setEditCourseOpen(false)}
        onSave={async (data) => { await patchCourse(data); setEditCourseOpen(false); }}
      />
      <TodoFormModal
        visible={todoModal.open}
        initial={todoModal.item}
        courseOptions={courses}
        lockedCourse={{ id: course.id, label: course.code }}
        onClose={() => setTodoModal({ open: false, item: null })}
        onSave={saveTodo}
      />
      <LinkFormModal visible={linkModal} initial={null} onClose={() => setLinkModal(false)} onSave={saveLink} />
      <ConfirmModal
        visible={!!deleteTarget}
        title={`Delete this ${deleteTarget?.type}?`}
        message="This can't be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

function InfoRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <Ionicons name={icon} size={16} color={COLORS.textMuted} style={{ width: 22 }} />
      <Text style={FONT.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginLeft: 5
  },
  avatarImg: { width: 60, height: 60 },
  tabTrack: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.pill,
    padding: 4,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
});
