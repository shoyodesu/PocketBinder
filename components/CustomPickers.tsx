import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../lib/theme';
import { FieldLabel } from './UI';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// Always renders 6 rows of days, so the picker never resizes between months
// (same fixed-height fix used on the main Calendar screen).
function buildGrid(year: number, month: number): (number | null)[][] {
  const firstDow = new Date(year, month, 1).getDay();
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

export function DateField({
  label,
  value,
  onChange,
  optional,
  placeholder = 'Select a date',
}: {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
  optional?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);
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
  }

  return (
    <View>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={17} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={value ? FONT.body : { ...FONT.body, color: COLORS.textFaint }}>
          {value ? formatDateLabel(value) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={FONT.h3}>{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dowRow}>
              {DOW.map((d, i) => (
                <Text key={i} style={styles.dowText}>{d}</Text>
              ))}
            </View>

            {/* Fixed-height 6-row grid — never reflows */}
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
                        style={[styles.dayCell, isSelected && styles.dayCellSelected]}
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

            <TouchableOpacity style={styles.doneBtn} onPress={() => setOpen(false)}>
              <Text style={{ color: '#FFF', fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const ITEM_H = 44;

function WheelColumn({
  data,
  selectedValue,
  onChange,
  format,
}: {
  data: number[];
  selectedValue: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const listRef = React.useRef<FlatList<number>>(null);
  const index = data.indexOf(selectedValue);

  return (
    <View style={{ height: ITEM_H * 3, width: 72 }}>
      <View pointerEvents="none" style={styles.wheelHighlight} />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(v) => String(v)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        initialScrollIndex={Math.max(0, index)}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.min(Math.max(i, 0), data.length - 1);
          onChange(data[clamped]);
        }}
        renderItem={({ item }) => (
          <View style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[FONT.h2, item !== selectedValue && { color: COLORS.textFaint, fontWeight: '600' }]}>
              {format ? format(item) : pad(item)}
            </Text>
          </View>
        )}
      />
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
  const [open, setOpen] = useState(false);
  const [h24, m] = value ? value.split(':').map(Number) : [9, 0];
  const [hour12, setHour12] = useState(h24 % 12 === 0 ? 12 : h24 % 12);
  const [minute, setMinute] = useState(m);
  const [isPM, setIsPM] = useState(h24 >= 12);

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
        <Ionicons name="time-outline" size={17} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={value ? FONT.body : { ...FONT.body, color: COLORS.textFaint }}>
          {value ? formatTimeLabel(value) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={[FONT.h3, { marginBottom: SPACING.md, textAlign: 'center' }]}>{label}</Text>
            <View style={styles.wheelRow}>
              <WheelColumn data={Array.from({ length: 12 }, (_, i) => i + 1)} selectedValue={hour12} onChange={setHour12} />
              <Text style={[FONT.h2, { marginHorizontal: 4 }]}>:</Text>
              <WheelColumn data={Array.from({ length: 12 }, (_, i) => i * 5)} selectedValue={minute} onChange={setMinute} />
              <View style={styles.ampmCol}>
                <TouchableOpacity
                  style={[styles.ampmBtn, !isPM && styles.ampmBtnActive]}
                  onPress={() => setIsPM(false)}
                >
                  <Text style={[FONT.h3, { color: !isPM ? '#FFF' : COLORS.textMuted }]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmBtn, isPM && styles.ampmBtnActive]}
                  onPress={() => setIsPM(true)}
                >
                  <Text style={[FONT.h3, { color: isPM ? '#FFF' : COLORS.textMuted }]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={confirm}>
              <Text style={{ color: '#FFF', fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
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
    height: 44 * 6, // fixed height, always 6 rows
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
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  doneBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelHighlight: {
    position: 'absolute',
    top: ITEM_H,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
  },
  ampmCol: {
    marginLeft: 12,
    gap: 8,
  },
  ampmBtn: {
    width: 52,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  ampmBtnActive: {
    backgroundColor: COLORS.primary,
  },
});
