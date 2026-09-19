import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { formatDateLabel, formatTimeLabel } from '../components/CustomPickers';
import { ConfirmModal, EventFormModal } from '../components/Modals';
import { Card, EmptyState, FAB, IconButton, ScreenHeader } from '../components/UI';
import { useLiveData } from '../lib/hooks';
import { EventsStore } from '../lib/storage';
import { COLORS, FONT, RADIUS, SPACING } from '../lib/theme';
import { CalendarEvent } from '../lib/types';

// Fixed regardless of how many rows a given month needs (5 vs 6) — this is
// the fix for bug #3. The calendar renders top-aligned inside this box, so
// short months just leave a little blank space instead of the whole page
// reflowing when you navigate between months.
const CALENDAR_HEIGHT = 360;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const { data: events, reload } = useLiveData('events', EventsStore.getAll, [] as CalendarEvent[]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [formState, setFormState] = useState<{ open: boolean; item: CalendarEvent | null }>({ open: false, item: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    events.forEach((e) => {
      marks[e.date] = marks[e.date] || { dots: [] };
      if (marks[e.date].dots.length < 3) {
        marks[e.date].dots.push({ color: COLORS.primary });
      }
    });
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: COLORS.primary };
    return marks;
  }, [events, selectedDate]);

  const dayEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [events, selectedDate]
  );

  async function handleSave(data: Omit<CalendarEvent, 'id'>) {
    if (formState.item) {
      await EventsStore.update(formState.item.id, data);
    } else {
      await EventsStore.add(data);
    }
    setFormState({ open: false, item: null });
    reload();
  }

  async function handleDelete() {
    if (deleteId) await EventsStore.remove(deleteId);
    setDeleteId(null);
    reload();
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Calendar" />

      <View style={styles.calendarWrap}>
        <Calendar
          current={selectedDate}
          onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
          markingType="multi-dot"
          markedDates={markedDates}
          style={{ height: CALENDAR_HEIGHT }}
          theme={{
            backgroundColor: COLORS.surface,
            calendarBackground: COLORS.surface,
            textSectionTitleColor: COLORS.textMuted,
            selectedDayBackgroundColor: COLORS.primary,
            selectedDayTextColor: '#FFF',
            todayTextColor: COLORS.primary,
            dayTextColor: COLORS.text,
            textDisabledColor: COLORS.textFaint,
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.text,
            textMonthFontWeight: '800',
            textDayFontWeight: '600',
            textDayHeaderFontWeight: '700',
          }}
        />
      </View>

      <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
        <Text style={[FONT.h3, { marginTop: SPACING.md, marginBottom: SPACING.sm }]}>{formatDateLabel(selectedDate)}</Text>
        {dayEvents.length === 0 ? (
          <EmptyState icon="calendar-outline" text="No events on this day." />
        ) : (
          dayEvents.map((e) => (
            <Card key={e.id} style={{ marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={FONT.body}>{e.title}</Text>
                <Text style={FONT.bodyMuted}>
                  {e.category}{e.hasTime && e.time ? ` \u00b7 ${formatTimeLabel(e.time)}` : ''}
                </Text>
              </View>
              <IconButton name="create-outline" size={15} onPress={() => setFormState({ open: true, item: e })} />
              <View style={{ width: 8 }} />
              <IconButton name="trash-outline" size={15} color={COLORS.danger} bg={COLORS.dangerSoft} onPress={() => setDeleteId(e.id)} />
            </Card>
          ))
        )}
      </View>

      <FAB onPress={() => setFormState({ open: true, item: null })} />

      <EventFormModal
        visible={formState.open}
        initial={formState.item}
        defaultDate={selectedDate}
        onClose={() => setFormState({ open: false, item: null })}
        onSave={handleSave}
      />
      <ConfirmModal
        visible={!!deleteId}
        title="Delete event?"
        message="This can't be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  calendarWrap: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
});
