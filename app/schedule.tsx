import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConfirmModal, ScheduleFormModal } from '../components/Modals';
import { FAB, ScreenHeader } from '../components/UI';
import { orderedWeekdays, useLiveData, useSettings } from '../lib/hooks';
import { CoursesStore, SchedulesStore } from '../lib/storage';
import { COLORS, RADIUS, SPACING } from '../lib/theme';
import { CourseItem, ScheduleItem, Weekday } from '../lib/types';

// Layout-only logic lives here; the Add/Edit form itself is
// ScheduleFormModal in components/Modals.tsx.
const HOUR_HEIGHT = 60;

interface RenderCardData {
  sched: ScheduleItem;
  top: number;
  height: number;
}

export default function ScheduleScreen() {
  const { data: settings } = useSettings();
  const days = useMemo(() => orderedWeekdays(settings.weekStartsMonday), [settings.weekStartsMonday]);

  const { data: schedules, reload } = useLiveData('schedules', SchedulesStore.getAll, [] as ScheduleItem[]);
  const { data: courses } = useLiveData('courses', CoursesStore.getAll, [] as CourseItem[]);

  const [currentDate, setCurrentDate] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(
        new Date().toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [formState, setFormState] = useState<{ open: boolean; item: ScheduleItem | null }>({ open: false, item: null });
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // Timeline auto-fits to the earliest start / latest end across all
  // schedules, instead of a fixed hour range.
  const { minStartHour, totalHours } = useMemo(() => {
    if (schedules.length === 0) return { minStartHour: 8, totalHours: 10 };
    let minStart = 24;
    let maxEnd = 0;
    schedules.forEach((s) => {
      const st = new Date(s.startTime);
      const et = new Date(s.endTime);
      const sDec = st.getHours() + st.getMinutes() / 60;
      const eDec = et.getHours() + et.getMinutes() / 60;
      if (sDec < minStart) minStart = Math.floor(sDec);
      if (eDec > maxEnd) maxEnd = Math.ceil(eDec);
    });
    const min = Math.max(0, minStart);
    const max = Math.min(24, Math.max(maxEnd, min + 1));
    return { minStartHour: min, totalHours: max - min };
  }, [schedules]);

  function getLayoutForDay(day: Weekday): RenderCardData[] {
    return schedules
      .filter((s) => s.days.includes(day))
      .map((s) => {
        const st = new Date(s.startTime);
        const et = new Date(s.endTime);
        const sDec = st.getHours() + st.getMinutes() / 60;
        const eDec = et.getHours() + et.getMinutes() / 60;
        return {
          sched: s,
          top: (sDec - minStartHour) * HOUR_HEIGHT,
          height: Math.max((eDec - sDec) * HOUR_HEIGHT, 30),
        };
      });
  }

  async function handleSave(data: Omit<ScheduleItem, 'id'>) {
    if (formState.item) {
      await SchedulesStore.update(formState.item.id, data);
    } else {
      await SchedulesStore.add(data);
    }
    setFormState({ open: false, item: null });
    reload();
  }

  async function confirmDelete() {
    if (formState.item) await SchedulesStore.remove(formState.item.id);
    setConfirmDeleteVisible(false);
    setFormState({ open: false, item: null });
    reload();
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Class Schedule" subtitle={currentDate} />

      <View style={styles.gridContainer}>
        <View style={styles.gridHeaderRow}>
          {days.map((d) => (
            <View key={d} style={styles.dayHeaderCell}>
              <Text style={styles.gridHeaderText}>{d}</Text>
            </View>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.gridBody, { minHeight: totalHours * HOUR_HEIGHT }]}>
            {days.map((day) => (
              <View key={day} style={styles.dayColumn}>
                {getLayoutForDay(day).map(({ sched, top, height }) => {
                  const sTime = new Date(sched.startTime);
                  const eTime = new Date(sched.endTime);
                  return (
                    <TouchableOpacity
                      key={`${sched.id}-${day}`}
                      style={[styles.schedCard, { top, height, backgroundColor: sched.color || '#BAE1FF' }]}
                      onPress={() => setFormState({ open: true, item: sched })}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.schedCardTime} numberOfLines={1}>
                        {sTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.schedCardCode} numberOfLines={2}>{sched.code || sched.title}</Text>
                      <Text style={styles.schedCardTime} numberOfLines={1}>
                        {eTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <FAB onPress={() => setFormState({ open: true, item: null })} />

      <ScheduleFormModal
        visible={formState.open}
        initial={formState.item}
        courseOptions={courses}
        existingSchedules={schedules}
        dayOrder={days}
        onClose={() => setFormState({ open: false, item: null })}
        onSave={handleSave}
        onRequestDelete={() => setConfirmDeleteVisible(true)}
      />
      <ConfirmModal
        visible={confirmDeleteVisible}
        title="Delete schedule?"
        message="Are you sure you want to delete this schedule?"
        onCancel={() => setConfirmDeleteVisible(false)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  gridContainer: { flex: 1, backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, overflow: 'hidden' },
  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayHeaderCell: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  gridHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  gridBody: { flexDirection: 'row', position: 'relative', flexGrow: 1 },
  dayColumn: { flex: 1, position: 'relative', height: '100%', borderRightWidth: 1, borderRightColor: COLORS.divider },
  schedCard: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 6,
    padding: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  schedCardCode: { fontSize: 10, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  schedCardTime: { fontSize: 8, color: '#4B5563', fontWeight: '600' },
});
