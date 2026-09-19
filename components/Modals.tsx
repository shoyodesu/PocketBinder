import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING, SWATCHES } from '../lib/theme';
import { CalendarEvent, CourseItem, ScheduleItem, StudentIdData, TodoItem, WEEKDAYS, Weekday } from '../lib/types';
import { DateField, TimeField } from './CustomPickers';
import { Button, ColorSwatchPicker, FieldLabel, SelectField, SwitchRow, TextField } from './UI';

// ---------------------------------------------------------------------------
// Every modal in the app lives in this file. Each one owns a local "draft"
// copy of its data, seeded fresh from `initial` every time it opens, and
// only ever calls onSave(draft) — the screen's real state is never touched
// until Save is pressed, and Cancel just closes without side effects.
// This is the fix for bug #5 (ID edits leaking live) applied everywhere.
// ---------------------------------------------------------------------------

function ModalShell({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={FONT.h2}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.sheet, { paddingBottom: SPACING.lg }]} onPress={(e) => e.stopPropagation()}>
          <Text style={FONT.h2}>{title}</Text>
          <Text style={[FONT.bodyMuted, { marginTop: 8, marginBottom: 20 }]}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} full />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={confirmLabel} variant="danger" onPress={onConfirm} full />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- Student ID ---------------------------------------------------------
export function IdEditModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: StudentIdData;
  onSave: (data: StudentIdData) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  return (
    <ModalShell visible={visible} onClose={onClose} title="Edit Student ID">
      <FieldLabel>Full name</FieldLabel>
      <TextField value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} placeholder="Juan Dela Cruz" />
      <View style={{ height: SPACING.md }} />
      <DateField label="Birthday" value={draft.birthday} onChange={(v) => setDraft({ ...draft, birthday: v })} optional />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>School</FieldLabel>
      <TextField value={draft.school} onChangeText={(v) => setDraft({ ...draft, school: v })} placeholder="School name" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Year & Section</FieldLabel>
      <TextField value={draft.year} onChangeText={(v) => setDraft({ ...draft, year: v })} placeholder="e.g. BSCS 3A" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel>Card color</FieldLabel>
      <ColorSwatchPicker value={draft.color} options={SWATCHES} onSelect={(c) => setDraft({ ...draft, color: c })} />
      <View style={{ height: SPACING.lg }} />
      <Button label="Save Changes" onPress={() => onSave(draft)} full />
    </ModalShell>
  );
}

// --- Course ---------------------------------------------------------------
export function CourseFormModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: Partial<CourseItem> | null;
  onSave: (data: Pick<CourseItem, 'code' | 'instructorName' | 'instructorEmail' | 'roomLocation'>) => void;
  onClose: () => void;
}) {
  const empty = { code: '', instructorName: '', instructorEmail: '', roomLocation: '' };
  const [draft, setDraft] = useState(empty);

  useEffect(() => {
    if (visible) {
      setDraft({
        code: initial?.code ?? '',
        instructorName: initial?.instructorName ?? '',
        instructorEmail: initial?.instructorEmail ?? '',
        roomLocation: initial?.roomLocation ?? '',
      });
    }
  }, [visible, initial]);

  return (
    <ModalShell visible={visible} onClose={onClose} title={initial?.code ? 'Edit Course' : 'Add Course'}>
      <FieldLabel>Course code / name</FieldLabel>
      <TextField value={draft.code} onChangeText={(v) => setDraft({ ...draft, code: v })} placeholder="e.g. CS 101" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Instructor name</FieldLabel>
      <TextField value={draft.instructorName} onChangeText={(v) => setDraft({ ...draft, instructorName: v })} placeholder="Instructor name" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Instructor email</FieldLabel>
      <TextField
        value={draft.instructorEmail}
        onChangeText={(v) => setDraft({ ...draft, instructorEmail: v })}
        placeholder="name@school.edu"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Room / location</FieldLabel>
      <TextField value={draft.roomLocation} onChangeText={(v) => setDraft({ ...draft, roomLocation: v })} placeholder="e.g. Room 204" />
      <View style={{ height: SPACING.lg }} />
      <Button label="Save Course" onPress={() => onSave(draft)} full disabled={!draft.code.trim()} />
    </ModalShell>
  );
}

// --- Todo (used inside a course's sub-page) --------------------------------
export function TodoFormModal({
  visible,
  initial,
  courseLabel,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: Partial<TodoItem> | null;
  courseLabel: string;
  onSave: (data: Omit<TodoItem, 'id'>) => void;
  onClose: () => void;
}) {
  const empty: Omit<TodoItem, 'id'> = {
    title: '', course: courseLabel, description: '', status: 'ongoing', hasDeadline: false, deadlineDate: undefined,
  };
  const [draft, setDraft] = useState(empty);

  useEffect(() => {
    if (visible) {
      setDraft({
        title: initial?.title ?? '',
        course: courseLabel,
        description: initial?.description ?? '',
        status: initial?.status ?? 'ongoing',
        hasDeadline: initial?.hasDeadline ?? false,
        deadlineDate: initial?.deadlineDate,
      });
    }
  }, [visible, initial, courseLabel]);

  return (
    <ModalShell visible={visible} onClose={onClose} title={initial?.title ? 'Edit To-do' : 'Add To-do'}>
      <FieldLabel>Title</FieldLabel>
      <TextField value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder="e.g. Problem Set 3" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Description</FieldLabel>
      <TextField
        value={draft.description}
        onChangeText={(v) => setDraft({ ...draft, description: v })}
        placeholder="Details..."
        multiline
        style={{ minHeight: 70, textAlignVertical: 'top' }}
      />
      <View style={{ height: SPACING.md }} />
      <SwitchRow label="Has a deadline" value={draft.hasDeadline} onChange={(v) => setDraft({ ...draft, hasDeadline: v })} />
      {draft.hasDeadline && (
        <>
          <View style={{ height: SPACING.sm }} />
          <DateField label="Deadline" value={draft.deadlineDate} onChange={(v) => setDraft({ ...draft, deadlineDate: v })} />
        </>
      )}
      <View style={{ height: SPACING.md }} />
      <SelectField
        label="Status"
        value={draft.status}
        placeholder="Select status"
        options={[
          { label: 'Ongoing', value: 'ongoing' },
          { label: 'Completed', value: 'completed' },
          { label: 'Missed', value: 'missed' },
        ]}
        onSelect={(v) => setDraft({ ...draft, status: v as TodoItem['status'] })}
      />
      <View style={{ height: SPACING.lg }} />
      <Button label="Save To-do" onPress={() => onSave(draft)} full disabled={!draft.title.trim()} />
    </ModalShell>
  );
}

// --- Link (used inside a course's sub-page) --------------------------------
export function LinkFormModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: { title?: string; url?: string } | null;
  onSave: (data: { title: string; url: string }) => void;
  onClose: () => void;
}) {
  const empty = { title: '', url: '' };
  const [draft, setDraft] = useState(empty);

  useEffect(() => {
    if (visible) setDraft({ title: initial?.title ?? '', url: initial?.url ?? '' });
  }, [visible, initial]);

  return (
    <ModalShell visible={visible} onClose={onClose} title="Add Link">
      <FieldLabel>Link title</FieldLabel>
      <TextField value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder="e.g. Course Syllabus" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel>URL</FieldLabel>
      <TextField
        value={draft.url}
        onChangeText={(v) => setDraft({ ...draft, url: v })}
        placeholder="https://..."
        autoCapitalize="none"
        keyboardType="url"
      />
      <View style={{ height: SPACING.lg }} />
      <Button label="Save Link" onPress={() => onSave(draft)} full disabled={!draft.title.trim() || !draft.url.trim()} />
    </ModalShell>
  );
}

// --- Calendar event ---------------------------------------------------------
const EVENT_CATEGORIES = ['Exam', 'Assignment', 'Meeting', 'Personal', 'Other'];

export function EventFormModal({
  visible,
  initial,
  defaultDate,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: Partial<CalendarEvent> | null;
  defaultDate: string;
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
  onClose: () => void;
}) {
  const empty: Omit<CalendarEvent, 'id'> = {
    title: '', category: 'Other', description: '', date: defaultDate, hasTime: false, time: undefined,
  };
  const [draft, setDraft] = useState(empty);

  useEffect(() => {
    if (visible) {
      setDraft({
        title: initial?.title ?? '',
        category: initial?.category ?? 'Other',
        description: initial?.description ?? '',
        date: initial?.date ?? defaultDate,
        hasTime: initial?.hasTime ?? false,
        time: initial?.time,
      });
    }
  }, [visible, initial, defaultDate]);

  return (
    <ModalShell visible={visible} onClose={onClose} title={initial?.title ? 'Edit Event' : 'Add Event'}>
      <FieldLabel>Title</FieldLabel>
      <TextField value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder="e.g. Midterm Exam" />
      <View style={{ height: SPACING.md }} />
      <SelectField
        label="Category"
        value={draft.category}
        placeholder="Select category"
        options={EVENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
        onSelect={(v) => setDraft({ ...draft, category: v })}
      />
      <View style={{ height: SPACING.md }} />
      <DateField label="Date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
      <View style={{ height: SPACING.md }} />
      <SwitchRow label="Has a specific time" value={draft.hasTime} onChange={(v) => setDraft({ ...draft, hasTime: v })} />
      {draft.hasTime && (
        <>
          <View style={{ height: SPACING.sm }} />
          <TimeField label="Time" value={draft.time} onChange={(v) => setDraft({ ...draft, time: v })} />
        </>
      )}
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Notes</FieldLabel>
      <TextField
        value={draft.description}
        onChangeText={(v) => setDraft({ ...draft, description: v })}
        placeholder="Details..."
        multiline
        style={{ minHeight: 60, textAlignVertical: 'top' }}
      />
      <View style={{ height: SPACING.lg }} />
      <Button label="Save Event" onPress={() => onSave(draft)} full disabled={!draft.title.trim()} />
    </ModalShell>
  );
}

// --- Weekly schedule block --------------------------------------------------
export function ScheduleFormModal({
  visible,
  initial,
  courseOptions,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: Partial<ScheduleItem> | null;
  courseOptions: CourseItem[];
  onSave: (data: Omit<ScheduleItem, 'id'>) => void;
  onClose: () => void;
}) {
  const empty: Omit<ScheduleItem, 'id'> = {
    courseId: undefined, code: '', instructor: '', room: '', days: [], startTime: '09:00', endTime: '10:00', color: SWATCHES[0],
  };
  const [draft, setDraft] = useState(empty);

  useEffect(() => {
    if (visible) {
      setDraft({
        courseId: initial?.courseId,
        code: initial?.code ?? '',
        instructor: initial?.instructor ?? '',
        room: initial?.room ?? '',
        days: initial?.days ?? [],
        startTime: initial?.startTime ?? '09:00',
        endTime: initial?.endTime ?? '10:00',
        color: initial?.color ?? SWATCHES[0],
      });
    }
  }, [visible, initial]);

  function applyCourse(courseId: string) {
    const course = courseOptions.find((c) => c.id === courseId);
    if (!course) return;
    // Correctly maps the real CourseItem field names (this was bug #4 —
    // the old code read fields like `instructor`/`room` that never existed).
    setDraft({
      ...draft,
      courseId: course.id,
      code: course.code ?? '',
      instructor: course.instructorName ?? '',
      room: course.roomLocation ?? '',
    });
  }

  function toggleDay(day: Weekday) {
    setDraft((d) => ({
      ...d,
      days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day],
    }));
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={initial?.code ? 'Edit Schedule' : 'Add Schedule'}>
      {courseOptions.length > 0 && (
        <>
          <SelectField
            label="Fill from a course"
            value={draft.courseId ?? ''}
            placeholder="Select existing course (optional)"
            options={courseOptions.map((c) => ({ label: c.code, value: c.id }))}
            onSelect={applyCourse}
            optional
          />
          <View style={{ height: SPACING.md }} />
        </>
      )}

      <FieldLabel>Course code / title</FieldLabel>
      <TextField value={draft.code} onChangeText={(v) => setDraft({ ...draft, code: v })} placeholder="e.g. CS 101" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Instructor</FieldLabel>
      <TextField value={draft.instructor} onChangeText={(v) => setDraft({ ...draft, instructor: v })} placeholder="Instructor name" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Room</FieldLabel>
      <TextField value={draft.room} onChangeText={(v) => setDraft({ ...draft, room: v })} placeholder="e.g. Room 204" />
      <View style={{ height: SPACING.md }} />

      <FieldLabel>Days</FieldLabel>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {WEEKDAYS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => toggleDay(d)}
            style={[styles.dayChip, draft.days.includes(d) && { backgroundColor: draft.color }]}
          >
            <Text style={[FONT.h3, { fontSize: 12, color: draft.days.includes(d) ? '#FFF' : COLORS.textMuted }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: SPACING.md }} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TimeField label="Start" value={draft.startTime} onChange={(v) => setDraft({ ...draft, startTime: v })} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="End" value={draft.endTime} onChange={(v) => setDraft({ ...draft, endTime: v })} />
        </View>
      </View>
      <View style={{ height: SPACING.md }} />

      <FieldLabel>Color</FieldLabel>
      <ColorSwatchPicker value={draft.color} options={SWATCHES} onSelect={(c) => setDraft({ ...draft, color: c })} />
      <View style={{ height: SPACING.lg }} />

      <Button
        label="Save Schedule"
        onPress={() => onSave(draft)}
        full
        disabled={!draft.code.trim() || draft.days.length === 0}
      />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChip: {
    width: 40,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
