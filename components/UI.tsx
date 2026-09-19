import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONT, RADIUS, SPACING, STICKER_SHADOW, CARD_SHADOW } from '../lib/theme';
import { useAccent } from '../lib/AccentContext';

// --- Button ------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  full,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  full?: boolean;
}) {
  const accent = useAccent();
  const bg =
    variant === 'primary' ? accent
    : variant === 'danger' ? COLORS.danger
    : variant === 'secondary' ? COLORS.surface
    : 'transparent';
  const textColor = variant === 'ghost' ? accent : variant === 'secondary' ? COLORS.text : '#FFF';
  const border = variant === 'secondary' ? { borderWidth: 1.5, borderColor: COLORS.border } : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        full && { alignSelf: 'stretch' },
        variant !== 'ghost' && STICKER_SHADOW,
        border,
      ]}
    >
      {icon && <Ionicons name={icon} size={17} color={textColor} style={{ marginRight: 6 }} />}
      <Text style={[FONT.button, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function IconButton({
  name,
  onPress,
  color = COLORS.text,
  bg = COLORS.surface,
  size = 20,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.iconBtn, { backgroundColor: bg }]} activeOpacity={0.7}>
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

// --- Card / layout -------------------------------------------------------
export function Card({ children, style, compact }: { children: React.ReactNode; style?: any; compact?: boolean }) {
  return <View style={[styles.card, CARD_SHADOW, compact && { padding: SPACING.md }, style]}>{children}</View>;
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={FONT.title}>{title}</Text>
        {subtitle ? <Text style={[FONT.bodyMuted, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={[FONT.label, styles.sectionLabel]}>{children}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function FAB({ onPress, icon = 'add' }: { onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const accent = useAccent();
  return (
    <TouchableOpacity style={[styles.fab, STICKER_SHADOW, { backgroundColor: accent }]} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={26} color="#FFF" />
    </TouchableOpacity>
  );
}

export function EmptyState({ icon = 'sparkles-outline', text }: { icon?: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={COLORS.textFaint} />
      <Text style={[FONT.bodyMuted, { marginTop: 8, textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '22' }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[FONT.h3, { fontSize: 12, color }]}>{label}</Text>
    </View>
  );
}

// --- Form inputs -----------------------------------------------------------
export function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <Text style={[FONT.label, { marginBottom: 6 }]}>
      {children}
      {optional ? '  (optional)' : ''}
    </Text>
  );
}

export function TextField(props: TextInputProps) {
  return <TextInput placeholderTextColor={COLORS.textFaint} style={styles.input} {...props} />;
}

export function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const accent = useAccent();
  return (
    <View style={styles.switchRow}>
      <Text style={FONT.body}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: accent + '55' }}
        thumbColor={value ? accent : '#FFF'}
      />
    </View>
  );
}

// A reusable "select from a list" field — replaces ad-hoc dropdown code
// that used to be duplicated per screen.
export function SelectField<T extends string>({
  label,
  value,
  placeholder,
  options,
  onSelect,
  optional,
  compact,
}: {
  label: string;
  value: T | '';
  placeholder: string;
  options: { label: string; value: T }[];
  onSelect: (v: T) => void;
  optional?: boolean;
  compact?: boolean; // inline pill, no field label, auto width — for header dropdowns
}) {
  const [open, setOpen] = React.useState(false);
  const accent = useAccent();
  const current = options.find((o) => o.value === value);

  if (compact) {
    return (
      <View>
        <TouchableOpacity style={styles.pillSelect} onPress={() => setOpen(true)} activeOpacity={0.7}>
          <Text style={[FONT.h3, { fontSize: 13, color: COLORS.text }]}>{current ? current.label : placeholder}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
            <Pressable style={styles.selectSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={[FONT.h3, { marginBottom: 10 }]}>{label}</Text>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.selectOption}
                    onPress={() => { onSelect(item.value); setOpen(false); }}
                  >
                    <Text style={FONT.body}>{item.label}</Text>
                    {item.value === value && <Ionicons name="checkmark" size={18} color={accent} />}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={Divider}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <TouchableOpacity style={styles.selectInput} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={current ? FONT.body : { ...FONT.body, color: COLORS.textFaint }}>
          {current ? current.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.selectSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={[FONT.h3, { marginBottom: 10 }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectOption}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={FONT.body}>{item.label}</Text>
                  {item.value === value && <Ionicons name="checkmark" size={18} color={accent} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={Divider}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function ColorSwatchPicker({ value, options, onSelect }: { value: string; options: string[]; onSelect: (c: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {options.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onSelect(c)}
          style={[
            styles.swatch,
            { backgroundColor: c },
            value === c && styles.swatchSelected,
          ]}
        >
          {value === c && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionLabel: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  selectInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  selectSheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: COLORS.text,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
});
