import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAccent } from '../lib/AccentContext';
import { COLORS, FONT, RADIUS, SPACING } from '../lib/theme';
import { FieldLabel } from './UI';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW_SUN_FIRST = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_MON_FIRST = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// Always renders 6 rows of days, so the picker never resizes between months
// (same fixed-height fix used on the main Calendar screen).
function buildGrid(year: number, month: number, weekStartsMonday: boolean): (number | null)[][] {
  let firstDow = new Date(year, month, 1).getDay(); // 0 = Sun
  if (weekStartsMonday) firstDow = (firstDow + 6) % 7; // shift so Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length < 42) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < 42; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function formatDateLabel(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatTimeLabel(hhmm?: string) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${period}`;
}

const YEAR_RANGE = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() + 10 - i); // newest first

export function DateField({
  label,
  value,
  onChange,
  optional,
  placeholder = 'Select a date',
  weekStartsMonday = false,
}: {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
  optional?: boolean;
  placeholder?: string;
  weekStartsMonday?: boolean;
}) {
  const accent = useAccent();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'day' | 'year'>('day');
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const grid = useMemo(() => buildGrid(viewYear, viewMonth, weekStartsMonday), [viewYear, viewMonth, weekStartsMonday]);
  const dow = weekStartsMonday ? DOW_MON_FIRST : DOW_SUN_FIRST;
  const selected = value ? value.split('-').map(Number) : null;

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  function pick(day: number) {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`);
    setOpen(false);
    setMode('day');
  }

  return (
    <View>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <TouchableOpacity style={styles.trigger} onPress={() => { setMode('day'); setOpen(true); }} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={17} color={accent} style={{ marginRight: 8 }} />
        <Text style={value ? FONT.body : { ...FONT.body, color: COLORS.textFaint }}>
          {value ? formatDateLabel(value) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            {mode === 'day' ? (
              <>
                <View style={styles.monthHeader}>
                  <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMode('year')} style={styles.yearJumpBtn}>
                    <Text style={FONT.h3}>{MONTHS[viewMonth]} {viewYear}</Text>
                    <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dowRow}>
                  {dow.map((d, i) => (
                    <Text key={i} style={styles.dowText}>{d}</Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {grid.map((row, ri) => (
                    <View key={ri} style={styles.gridRow}>
                      {row.map((day, ci) => {
                        const isSelected =
                          day && selected && selected[0] === viewYear && selected[1] === viewMonth + 1 && selected[2] === day;
                        return (
                          <TouchableOpacity
                            key={ci}
                            disabled={!day}
                            onPress={() => day && pick(day)}
                            style={[styles.dayCell, isSelected ? { backgroundColor: accent } : null]}
                          >
                            {day ? (
                              <Text style={[FONT.body, isSelected && { color: '#FFF', fontWeight: '800' }]}>{day}</Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </>
            ) : (
              // Quick year picker — jumping to a birth year like 2000 by
              // tapping the month arrow hundreds of times was the actual complaint.
              <>
                <Text style={[FONT.h3, { textAlign: 'center', marginBottom: SPACING.sm }]}>Select a year</Text>
                <FlatList
                  data={YEAR_RANGE}
                  keyExtractor={(y) => String(y)}
                  numColumns={4}
                  style={{ height: 44 * 6 }}
                  initialScrollIndex={Math.max(0, Math.floor((YEAR_RANGE.indexOf(viewYear) - 8) / 4))}
                  getItemLayout={(_, index) => {
                    const row = Math.floor(index / 4);
                    return { length: 48, offset: 48 * row, index };
                  }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.yearCell, item === viewYear && { backgroundColor: accent }]}
                      onPress={() => { setViewYear(item); setMode('day'); }}
                    >
                      <Text style={[FONT.body, item === viewYear && { color: '#FFF', fontWeight: '800' }]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: accent }]} onPress={() => { setOpen(false); setMode('day'); }}>
              <Text style={{ color: '#FFF', fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stepper({
  value,
  onChange,
  format,
  accent,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  accent: string;
  step?: number;
}) {
  return (
    <View style={styles.stepperCol}>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(value + step)}>
        <Ionicons name="chevron-up" size={20} color={accent} />
      </TouchableOpacity>
      <View style={styles.stepperValue}>
        <Text style={FONT.title}>{format(value)}</Text>
      </View>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(value - step)}>
        <Ionicons name="chevron-down" size={20} color={accent} />
      </TouchableOpacity>
    </View>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  optional,
  placeholder = 'Select a time',
}: {
  label: string;
  value?: string;
  onChange: (hhmm: string) => void;
  optional?: boolean;
  placeholder?: string;
}) {
  const accent = useAccent();
  const [open, setOpen] = useState(false);
  const [h24, m] = value ? value.split(':').map(Number) : [9, 0];
  const [hour12, setHour12] = useState(h24 % 12 === 0 ? 12 : h24 % 12);
  const [minute, setMinute] = useState(Math.round(m / 5) * 5 % 60);
  const [isPM, setIsPM] = useState(h24 >= 12);

  function changeHour(v: number) {
    let next = v;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setHour12(next);
  }

  function changeMinute(v: number) {
    let next = v % 60;
    if (next < 0) next += 60;
    setMinute(next);
  }

  function confirm() {
    let h = hour12 % 12;
    if (isPM) h += 12;
    onChange(`${pad(h)}:${pad(minute)}`);
    setOpen(false);
  }

  return (
    <View>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="time-outline" size={17} color={accent} style={{ marginRight: 8 }} />
        <Text style={value ? FONT.body : { ...FONT.body, color: COLORS.textFaint }}>
          {value ? formatTimeLabel(value) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={[FONT.h3, { marginBottom: SPACING.md, textAlign: 'center' }]}>{label}</Text>
            <View style={styles.stepperRow}>
              <Stepper value={hour12} onChange={changeHour} format={(v) => pad(v)} accent={accent} />
              <Text style={[FONT.title, { marginHorizontal: 4 }]}>:</Text>
              <Stepper value={minute} onChange={changeMinute} format={(v) => pad(v)} accent={accent} step={5} />
              <View style={styles.ampmCol}>
                <TouchableOpacity
                  style={[styles.ampmBtn, !isPM && { backgroundColor: accent }]}
                  onPress={() => setIsPM(false)}
                >
                  <Text style={[FONT.h3, { color: !isPM ? '#FFF' : COLORS.textMuted }]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmBtn, isPM && { backgroundColor: accent }]}
                  onPress={() => setIsPM(true)}
                >
                  <Text style={[FONT.h3, { color: isPM ? '#FFF' : COLORS.textMuted }]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: accent }]} onPress={confirm}>
              <Text style={{ color: '#FFF', fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  yearJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  grid: {
    height: 44 * 6,
  },
  gridRow: {
    flexDirection: 'row',
    height: 44,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: RADIUS.sm,
  },
  yearCell: {
    flex: 1,
    height: 48,
    margin: 2,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCol: {
    alignItems: 'center',
  },
  stepperBtn: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    width: 64,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
  },
  ampmCol: {
    marginLeft: 16,
    gap: 8,
  },
  ampmBtn: {
    width: 52,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
});
