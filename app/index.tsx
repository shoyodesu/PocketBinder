import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDateLabel } from '../components/CustomPickers';
import { ConfirmModal, IdEditModal, TodoFormModal } from '../components/Modals';
import { Card, EmptyState, FAB, IconButton, Pill, ScreenHeader, SectionLabel, SelectField } from '../components/UI';
import { useLiveData, useSettings } from '../lib/hooks';
import { CoursesStore, StudentIdStore, TodosStore } from '../lib/storage';
import { COLORS, FONT, RADIUS, SPACING, STICKER_SHADOW } from '../lib/theme';
import { CourseItem, StudentIdData, TodoItem } from '../lib/types';

const EMPTY_ID: StudentIdData = { name: '', birthday: '', school: '', year: '', color: COLORS.primary, photo: null };

const STATUS_COLOR: Record<TodoItem['status'], string> = {
  ongoing: COLORS.accentBlue,
  completed: COLORS.accentGreen,
  missed: COLORS.danger,
};
const STATUS_LABEL: Record<TodoItem['status'], string> = {
  ongoing: 'Upcoming',
  completed: 'Completed',
  missed: 'Missed',
};

type Filter = 'all' | TodoItem['status'];

export default function HomeScreen() {
  const { data: studentId, reload: reloadId } = useLiveData('studentId', StudentIdStore.get, EMPTY_ID);
  const { data: settings } = useSettings();
  const { data: courses } = useLiveData('courses', CoursesStore.getAll, [] as CourseItem[]);
  const { data: todos, reload: reloadTodos } = useLiveData('todos', TodosStore.getAll, [] as TodoItem[]);

  const [editOpen, setEditOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [todoModal, setTodoModal] = useState<{ open: boolean; item: TodoItem | null }>({ open: false, item: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      const updated = { ...studentId, photo: result.assets[0].uri };
      await StudentIdStore.save(updated);
      reloadId();
    }
  }

  const visibleTodos = useMemo(() => {
    const list = filter === 'all' ? todos : todos.filter((t) => t.status === filter);
    return [...list].sort((a, b) => {
      if (a.hasDeadline && b.hasDeadline) return (a.deadlineDate || '').localeCompare(b.deadlineDate || '');
      if (a.hasDeadline) return -1;
      if (b.hasDeadline) return 1;
      return 0;
    });
  }, [todos, filter]);

  async function saveTodo(data: Omit<TodoItem, 'id'>) {
    if (todoModal.item) {
      await TodosStore.update(todoModal.item.id, data);
    } else {
      await TodosStore.add(data);
    }
    setTodoModal({ open: false, item: null });
    reloadTodos();
  }

  async function handleDelete() {
    if (deleteId) await TodosStore.remove(deleteId);
    setDeleteId(null);
    reloadTodos();
  }

  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title={`Hi, ${settings.username}!`} subtitle="Here's your PocketBinder overview" />

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

        <View style={styles.sectionHeader}>
          <SectionLabel>TO-DO</SectionLabel>
          <SelectField
            label="Filter"
            value={filter}
            placeholder="All"
            compact
            options={[
              { label: 'All', value: 'all' },
              { label: 'Upcoming', value: 'ongoing' },
              { label: 'Missed', value: 'missed' },
              { label: 'Completed', value: 'completed' },
            ]}
            onSelect={(v) => setFilter(v as Filter)}
          />
        </View>


        {visibleTodos.length === 0 ? (
          <Card>
            <EmptyState icon="checkmark-done-circle-outline" text="Nothing here. You're all caught up!" />
          </Card>
        ) : (
          visibleTodos.map((t) => (
            <Card key={t.id} style={{ marginBottom: SPACING.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={FONT.h3}>{t.title}</Text>
                  {!!t.courseLabel && <Text style={FONT.bodyMuted}>{t.courseLabel}</Text>}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <Pill label={STATUS_LABEL[t.status]} color={STATUS_COLOR[t.status]} />
                    {t.hasDeadline && t.deadlineDate && <Pill label={formatDateLabel(t.deadlineDate)} color={COLORS.secondary} />}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <IconButton name="create-outline" size={15} onPress={() => setTodoModal({ open: true, item: t })} />
                  <IconButton name="trash-outline" size={15} color={COLORS.danger} bg={COLORS.dangerSoft} onPress={() => setDeleteId(t.id)} />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>

      <FAB onPress={() => setTodoModal({ open: true, item: null })} />

      <IdEditModal
        visible={editOpen}
        initial={studentId}
        weekStartsMonday={settings.weekStartsMonday}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => {
          await StudentIdStore.save(data);
          setEditOpen(false);
        }}
      />
      <TodoFormModal
        visible={todoModal.open}
        initial={todoModal.item}
        courseOptions={courses}
        onClose={() => setTodoModal({ open: false, item: null })}
        onSave={saveTodo}
      />
      <ConfirmModal
        visible={!!deleteId}
        title="Delete to-do?"
        message="This can't be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </View>
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
    marginLeft: 5,
    letterSpacing: 1,
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
  idBirthday: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
});
