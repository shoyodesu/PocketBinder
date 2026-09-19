import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTimeLabel } from '../components/CustomPickers';
import { ConfirmModal, ScheduleFormModal } from '../components/Modals';
import { Card, EmptyState, FAB, IconButton, ScreenHeader } from '../components/UI';
import { useLiveData } from '../lib/hooks';
import { CoursesStore, SchedulesStore } from '../lib/storage';
import { COLORS, FONT, RADIUS, SPACING } from '../lib/theme';
import { CourseItem, ScheduleItem, WEEKDAYS, Weekday } from '../lib/types';

function todayWeekday(): Weekday {
  return WEEKDAYS[new Date().getDay()];
}

export default function ScheduleScreen() {
  const { data: schedules, reload } = useLiveData('schedules', SchedulesStore.getAll, [] as ScheduleItem[]);
  const { data: courses } = useLiveData('courses', CoursesStore.getAll, [] as CourseItem[]);
  const [activeDay, setActiveDay] = useState<Weekday>(todayWeekday());
  const [formState, setFormState] = useState<{ open: boolean; item: ScheduleItem | null }>({ open: false, item: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dayItems = useMemo(
    () =>
      schedules
        .filter((s) => s.days.includes(activeDay))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedules, activeDay]
  );

  async function handleSave(data: Omit<ScheduleItem, 'id'>) {
    if (formState.item) {
      await SchedulesStore.update(formState.item.id, data);
    } else {
      await SchedulesStore.add(data);
    }
    setFormState({ open: false, item: null });
    reload();
  }

  async function handleDelete() {
    if (deleteId) await SchedulesStore.remove(deleteId);
    setDeleteId(null);
    reload();
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Schedule" />

      <View style={styles.dayRow}>
        {WEEKDAYS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setActiveDay(d)}
            style={[styles.dayChip, activeDay === d && styles.dayChipActive]}
          >
            <Text style={[FONT.h3, { fontSize: 12, color: activeDay === d ? '#FFF' : COLORS.textMuted }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>
        {dayItems.length === 0 ? (
          <EmptyState icon="time-outline" text="Nothing scheduled for this day." />
        ) : (
          dayItems.map((item) => (
            <Card key={item.id} style={{ marginBottom: SPACING.sm, flexDirection: 'row' }}>
              <View style={[styles.colorBar, { backgroundColor: item.color }]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={FONT.h3}>{item.code}</Text>
                {!!item.instructor && <Text style={FONT.bodyMuted}>{item.instructor}</Text>}
                {!!item.room && <Text style={FONT.bodyMuted}>{item.room}</Text>}
                <Text style={[FONT.bodyMuted, { color: COLORS.primary, marginTop: 4, fontWeight: '700' }]}>
                  {`${formatTimeLabel(item.startTime)} \u2013 ${formatTimeLabel(item.endTime)}`}
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                <IconButton name="create-outline" size={15} onPress={() => setFormState({ open: true, item })} />
                <IconButton name="trash-outline" size={15} color={COLORS.danger} bg={COLORS.dangerSoft} onPress={() => setDeleteId(item.id)} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB onPress={() => setFormState({ open: true, item: null })} />

      <ScheduleFormModal
        visible={formState.open}
        initial={formState.item ?? { days: [activeDay] }}
        courseOptions={courses}
        onClose={() => setFormState({ open: false, item: null })}
        onSave={handleSave}
      />
      <ConfirmModal
        visible={!!deleteId}
        title="Delete schedule?"
        message="This can't be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  dayChip: {
    width: 42,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: COLORS.primary,
  },
  colorBar: {
    width: 5,
    borderRadius: 3,
  },
});
