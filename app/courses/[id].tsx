import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDateLabel } from '../../components/CustomPickers';
import { ConfirmModal, CourseFormModal, LinkFormModal, TodoFormModal } from '../../components/Modals';
import { Card, EmptyState, IconButton, Pill, SectionLabel } from '../../components/UI';
import { openStoredFile, pickAndStoreFile } from '../../lib/fileOpen';
import { useLiveData } from '../../lib/hooks';
import { CoursesStore } from '../../lib/storage';
import { COLORS, FONT, RADIUS, SPACING } from '../../lib/theme';
import { CourseItem, FileItem, LinkItem, TodoItem } from '../../lib/types';

const STATUS_COLOR: Record<TodoItem['status'], string> = {
  ongoing: COLORS.accentBlue,
  completed: COLORS.accentGreen,
  missed: COLORS.danger,
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: courses, reload } = useLiveData('courses', CoursesStore.getAll, [] as CourseItem[]);
  const course = useMemo(() => courses.find((c) => c.id === id), [courses, id]);

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

  async function saveTodo(data: Omit<TodoItem, 'id'>) {
    const todos = todoModal.item
      ? course!.todos.map((t) => (t.id === todoModal.item!.id ? { ...t, ...data } : t))
      : [...course!.todos, { ...data, id: `${Date.now()}` }];
    await patchCourse({ todos });
    setTodoModal({ open: false, item: null });
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
      await patchCourse({ todos: course!.todos.filter((t) => t.id !== deleteTarget.id) });
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

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}>
        <Text style={FONT.title}>{course.code}</Text>
        {(course.instructorName || course.instructorEmail || course.roomLocation) ? (
          <Card style={{ marginTop: SPACING.md }}>
            {!!course.instructorName && <InfoRow icon="person-outline" text={course.instructorName} />}
            {!!course.instructorEmail && <InfoRow icon="mail-outline" text={course.instructorEmail} />}
            {!!course.roomLocation && <InfoRow icon="location-outline" text={course.roomLocation} />}
          </Card>
        ) : null}

        <View style={styles.sectionHeader}>
          <SectionLabel>TO-DOS</SectionLabel>
          <IconButton name="add" onPress={() => setTodoModal({ open: true, item: null })} bg={COLORS.primarySoft} color={COLORS.primary} />
        </View>
        {course.todos.length === 0 ? (
          <EmptyState icon="checkbox-outline" text="No to-dos for this course yet." />
        ) : (
          course.todos.map((t) => (
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

        <View style={styles.sectionHeader}>
          <SectionLabel>FILES</SectionLabel>
          <IconButton name="add" onPress={addFile} bg={COLORS.primarySoft} color={COLORS.primary} />
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

        <View style={styles.sectionHeader}>
          <SectionLabel>LINKS</SectionLabel>
          <IconButton name="add" onPress={() => setLinkModal(true)} bg={COLORS.primarySoft} color={COLORS.primary} />
        </View>
        {course.links.length === 0 ? (
          <EmptyState icon="link-outline" text="No links added yet." />
        ) : (
          course.links.map((l) => (
            <Card key={l.id} style={{ marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="link-outline" size={20} color={COLORS.secondary} />
              <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => Linking.openURL(l.url)}>
                <Text style={FONT.body} numberOfLines={1}>{l.title}</Text>
                <Text style={FONT.bodyMuted} numberOfLines={1}>{l.url}</Text>
              </TouchableOpacity>
              <IconButton name="trash-outline" size={15} color={COLORS.danger} bg={COLORS.dangerSoft} onPress={() => setDeleteTarget({ type: 'link', id: l.id })} />
            </Card>
          ))
        )}
      </ScrollView>

      <CourseFormModal
        visible={editCourseOpen}
        initial={course}
        onClose={() => setEditCourseOpen(false)}
        onSave={async (data) => { await patchCourse(data); setEditCourseOpen(false); }}
      />
      <TodoFormModal
        visible={todoModal.open}
        initial={todoModal.item}
        courseLabel={course.code}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
});
