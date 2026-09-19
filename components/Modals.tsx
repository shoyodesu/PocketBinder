import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccent } from '../lib/AccentContext';
import { normalizeUrl } from '../lib/links';
import { COLORS, FONT, RADIUS, SPACING, SWATCHES } from '../lib/theme';
import { CalendarEvent, CourseItem, ScheduleItem, StudentIdData, TodoItem, Weekday } from '../lib/types';
import { DateField, TimeField } from './CustomPickers';
import { Button, ColorSwatchPicker, FieldLabel, IconButton, SelectField, SwitchRow, TextField } from './UI';

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
  weekStartsMonday,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: StudentIdData;
  weekStartsMonday?: boolean;
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
      <TextField value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} placeholder="Your Name" />
      <View style={{ height: SPACING.md }} />
      <DateField
        label="Birthday"
        value={draft.birthday}
        onChange={(v) => setDraft({ ...draft, birthday: v })}
        optional
        weekStartsMonday={weekStartsMonday}
      />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>School</FieldLabel>
      <TextField value={draft.school} onChangeText={(v) => setDraft({ ...draft, school: v })} placeholder="School name" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Year Level</FieldLabel>
      <TextField value={draft.year} onChangeText={(v) => setDraft({ ...draft, year: v })} placeholder="Year Level" />
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
      <TextField value={draft.code} onChangeText={(v) => setDraft({ ...draft, code: v })} placeholder="Course code" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Instructor name</FieldLabel>
      <TextField value={draft.instructorName} onChangeText={(v) => setDraft({ ...draft, instructorName: v })} placeholder="Instructor name" />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Instructor email</FieldLabel>
      <TextField
        value={draft.instructorEmail}
        onChangeText={(v) => setDraft({ ...draft, instructorEmail: v })}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={{ height: SPACING.md }} />
      <FieldLabel optional>Room / location</FieldLabel>
      <TextField value={draft.roomLocation} onChangeText={(v) => setDraft({ ...draft, roomLocation: v })} placeholder="Room location" />
      <View style={{ height: SPACING.lg }} />
      <Button label="Save Course" onPress={() => onSave(draft)} full disabled={!draft.code.trim()} />
    </ModalShell>
  );
}

// --- Todo (global list, shown on Home; optionally locked to one course) ---
export function TodoFormModal({
  visible,
  initial,
  courseOptions,
  lockedCourse,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: Partial<TodoItem> | null;
  courseOptions: CourseItem[];
  lockedCourse?: { id: string; label: string } | null;
  onSave: (data: Omit<TodoItem, 'id'>) => void;
  onClose: () => void;
}) {
  const empty: Omit<TodoItem, 'id'> = {
    title: '', courseId: lockedCourse?.id, courseLabel: lockedCourse?.label ?? '', description: '',
    status: 'ongoing', hasDeadline: false, deadlineDate: undefined,
  };
  const [draft, setDraft] = useState(empty);

  useEffect(() => {
    if (visible) {
      setDraft({
        title: initial?.title ?? '',
        courseId: lockedCourse?.id ?? initial?.courseId,
        courseLabel: lockedCourse?.label ?? initial?.courseLabel ?? '',
        description: initial?.description ?? '',
        status: initial?.status ?? 'ongoing',
        hasDeadline: initial?.hasDeadline ?? false,
        deadlineDate: initial?.deadlineDate,
      });
    }
  }, [visible, initial, lockedCourse]);

  function applyCourse(courseId: string) {
    const course = courseOptions.find((c) => c.id === courseId);
    if (!course) return;
    setDraft((d) => ({ ...d, courseId: course.id, courseLabel: course.code }));
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={initial?.title ? 'Edit To-do' : 'Add To-do'}>
      <FieldLabel>Title</FieldLabel>
      <TextField value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder="To-do" />
      <View style={{ height: SPACING.md }} />

      {!lockedCourse && courseOptions.length > 0 && (
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
      {!lockedCourse && (
        <>
          <FieldLabel optional>Course label</FieldLabel>
          <TextField value={draft.courseLabel} onChangeText={(v) => setDraft({ ...draft, courseLabel: v })} placeholder="Label" />
          <View style={{ height: SPACING.md }} />
        </>
      )}

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
          { label: 'Upcoming', value: 'ongoing' },
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
      <TextField value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder="Title" />
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
      <Button
        label="Save Link"
        onPress={() => onSave({ title: draft.title, url: normalizeUrl(draft.url) })}
        full
        disabled={!draft.title.trim() || !draft.url.trim()}
      />
    </ModalShell>
  );
}

// --- Calendar event ---------------------------------------------------------
const EVENT_CATEGORIES = ['Exam', 'Assignment', 'Meeting', 'Personal', 'Other'];

export function EventFormModal({
  visible,
  initial,
  defaultDate,
  courseOptions,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: Partial<CalendarEvent> | null;
  defaultDate: string;
  courseOptions: CourseItem[];
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
  onClose: () => void;
}) {
  const empty: Omit<CalendarEvent, 'id'> = {
    title: '', category: 'Other', description: '', date: defaultDate, hasTime: false, time: undefined, courseId: undefined,
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
        courseId: initial?.courseId,
      });
    }
  }, [visible, initial, defaultDate]);

  function applyCourse(courseId: string) {
    const course = courseOptions.find((c) => c.id === courseId);
    if (!course) return;
    setDraft((d) => ({ ...d, courseId: course.id, title: d.title || course.code }));
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={initial?.title ? 'Edit Event' : 'Add Event'}>
      <FieldLabel>Title</FieldLabel>
      <TextField value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder="Event title" />
      <View style={{ height: SPACING.md }} />
      <SelectField
        label="Category"
        value={draft.category}
        placeholder="Select category"
        options={EVENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
        onSelect={(v) => setDraft({ ...draft, category: v, courseId: v === 'Other' ? draft.courseId : undefined })}
      />
      {draft.category === 'Other' && courseOptions.length > 0 && (
        <>
          <View style={{ height: SPACING.md }} />
          <SelectField
            label="Which course?"
            value={draft.courseId ?? ''}
            placeholder="Select existing course"
            options={courseOptions.map((c) => ({ label: c.code, value: c.id }))}
            onSelect={applyCourse}
            optional
          />
        </>
      )}
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
});

// --- Weekly schedule form ---------------------------------------------------
// Lives here (not as a generic reusable shape) because its validation needs
// the full list of existing schedules for overlap checking, and its course
// dropdown is an inline overlay rather than the shared SelectField sheet —
// both specific to this one screen. Kept in this file per your request that
// every modal live in one place, even the bespoke ones.

function doTimesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  const aStart = startA.getHours() * 60 + startA.getMinutes();
  const aEnd = endA.getHours() * 60 + endA.getMinutes();
  const bStart = startB.getHours() * 60 + startB.getMinutes();
  const bEnd = endB.getHours() * 60 + endB.getMinutes();
  return aStart < bEnd && aEnd > bStart;
}
function schedPad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function schedHHMM(d: Date) {
  return `${schedPad(d.getHours())}:${schedPad(d.getMinutes())}`;
}
function schedWithTime(base: Date, hhmmStr: string) {
  const [h, m] = hhmmStr.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}
function defaultStart() {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  return d;
}
function defaultEnd() {
  const d = new Date();
  d.setHours(9, 30, 0, 0);
  return d;
}

export function ScheduleFormModal({
  visible,
  initial,
  courseOptions,
  existingSchedules,
  dayOrder,
  onSave,
  onRequestDelete,
  onClose,
}: {
  visible: boolean;
  initial: ScheduleItem | null;
  courseOptions: CourseItem[];
  existingSchedules: ScheduleItem[];
  dayOrder: Weekday[];
  onSave: (data: Omit<ScheduleItem, 'id'>) => void;
  onRequestDelete?: () => void;
  onClose: () => void;
}) {
  const accent = useAccent();
  const [selectedCourseId, setSelectedCourseId] = useState('general');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [days, setDays] = useState<Weekday[]>([]);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [color, setColor] = useState(SWATCHES[0]);

  useEffect(() => {
    if (!visible) return;
    setShowCourseDropdown(false);
    if (initial) {
      setSelectedCourseId(initial.courseId ?? 'general');
      setCode(initial.code || initial.title);
      setTitle(initial.title);
      setInstructor(initial.instructor || '');
      setRoom(initial.room || '');
      setDays(initial.days);
      setStartTime(new Date(initial.startTime));
      setEndTime(new Date(initial.endTime));
      setColor(initial.color || SWATCHES[0]);
    } else {
      setSelectedCourseId('general');
      setCode('');
      setTitle('');
      setInstructor('');
      setRoom('');
      setDays([]);
      setStartTime(defaultStart());
      setEndTime(defaultEnd());
      setColor(SWATCHES[0]);
    }
  }, [visible, initial]);

  function toggleDay(day: Weekday) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  // Fixed: this used to read `found.instructor` / `found.room`, fields that
  // don't exist on a real CourseItem (it's `instructorName` / `roomLocation`),
  // so autofill silently produced blanks even when the course had that data.
  function handleSelectCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setShowCourseDropdown(false);
    if (courseId === 'general') {
      setCode('');
      setTitle('');
      setInstructor('');
      setRoom('');
    } else {
      const found = courseOptions.find((c) => c.id === courseId);
      if (found) {
        setCode(found.code || '');
        setInstructor(found.instructorName || '');
        setRoom(found.roomLocation || '');
        // No separate "title" field exists on a real course — only `code` —
        // so unlike code/instructor/room, title is left for you to type.
      }
    }
  }

  function handleSave() {
    if (!code.trim() && !title.trim()) {
      Alert.alert('Validation Error', 'Please enter a course code or schedule title.');
      return;
    }
    if (days.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one day for this schedule.');
      return;
    }
    if (startTime >= endTime) {
      Alert.alert('Validation Error', 'End time must be after start time.');
      return;
    }

    const hasOverlap = existingSchedules.some((existing) => {
      if (initial && existing.id === initial.id) return false;
      const sharesDay = existing.days.some((d) => days.includes(d));
      if (!sharesDay) return false;
      return doTimesOverlap(startTime, endTime, new Date(existing.startTime), new Date(existing.endTime));
    });
    if (hasOverlap) {
      Alert.alert('Schedule Conflict', 'This schedule overlaps with an existing class on one of the selected days. Please adjust the time or days.');
      return;
    }

    onSave({
      courseId: selectedCourseId === 'general' ? undefined : selectedCourseId,
      code: code || title,
      title: title || code,
      instructor,
      room,
      days,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      color,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={scheduleModalStyles.overlay}>
        <View style={scheduleModalStyles.content}>
          <View style={scheduleModalStyles.headerRow}>
            <Text style={FONT.h2}>{initial ? 'Edit Schedule' : 'Add Schedule'}</Text>
            {initial && onRequestDelete && (
              <IconButton name="trash-outline" onPress={onRequestDelete} bg={COLORS.dangerSoft} color={COLORS.danger} size={18} />
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <FieldLabel optional>Select Course</FieldLabel>
            <View style={scheduleModalStyles.dropdownWrapper}>
              <TouchableOpacity style={scheduleModalStyles.dropdownBtn} onPress={() => setShowCourseDropdown(!showCourseDropdown)}>
                <Text style={FONT.body}>
                  {selectedCourseId === 'general' ? 'General (Custom Schedule)' : (courseOptions.find((c) => c.id === selectedCourseId)?.code || 'Course Selected')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              {showCourseDropdown && (
                <View style={scheduleModalStyles.dropdownMenu}>
                  <TouchableOpacity style={scheduleModalStyles.dropdownMenuItem} onPress={() => handleSelectCourse('general')}>
                    <Text style={FONT.body}>General (Custom Schedule)</Text>
                  </TouchableOpacity>
                  {courseOptions.map((course) => (
                    <TouchableOpacity key={course.id} style={scheduleModalStyles.dropdownMenuItem} onPress={() => handleSelectCourse(course.id)}>
                      <Text style={FONT.body}>{course.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: SPACING.md }} />
            <FieldLabel>Subject Code</FieldLabel>
            <TextField placeholder="Subject" value={code} onChangeText={setCode} />

            <View style={{ height: SPACING.md }} />
            <FieldLabel optional>Schedule Title</FieldLabel>
            <TextField placeholder="Title" value={title} onChangeText={setTitle} />

            <View style={{ height: SPACING.md }} />
            <FieldLabel optional>Instructor</FieldLabel>
            <TextField placeholder="e.g. Prof. Smith" value={instructor} onChangeText={setInstructor} />

            <View style={{ height: SPACING.md }} />
            <FieldLabel optional>Room location</FieldLabel>
            <TextField placeholder="e.g. Lab 302" value={room} onChangeText={setRoom} />

            <View style={{ height: SPACING.md }} />
            <FieldLabel>Day/s</FieldLabel>
            <View style={scheduleModalStyles.daysRow}>
              {dayOrder.map((day) => {
                const isSelected = days.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[scheduleModalStyles.dayChip, isSelected && { backgroundColor: accent }]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[scheduleModalStyles.dayChipText, isSelected && { color: '#FFF' }]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: SPACING.md }} />
            <FieldLabel>Class Hours</FieldLabel>
            <View style={scheduleModalStyles.timeRow}>
              <View style={{ flex: 1 }}>
                <TimeField label="Start Time" value={schedHHMM(startTime)} onChange={(v) => setStartTime(schedWithTime(startTime, v))} />
              </View>
              <View style={{ flex: 1 }}>
                <TimeField label="End Time" value={schedHHMM(endTime)} onChange={(v) => setEndTime(schedWithTime(endTime, v))} />
              </View>
            </View>

            <View style={{ height: SPACING.md }} />
            <FieldLabel>Color</FieldLabel>
            <ColorSwatchPicker value={color} options={SWATCHES} onSelect={setColor} />

            <View style={scheduleModalStyles.actions}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={onClose} full />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={initial ? 'Update' : 'Save'} onPress={handleSave} full />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const scheduleModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: SPACING.lg },
  content: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '88%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  dropdownWrapper: { position: 'relative', zIndex: 100 },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
    zIndex: 101,
    maxHeight: 220,
  },
  dropdownMenuItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  timeRow: { flexDirection: 'row', gap: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: SPACING.lg },
});
