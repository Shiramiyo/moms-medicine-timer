import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicationCategory } from '../types/timer';
import { Colors } from '../theme/colors';

interface AddTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTimer: (
    name: string,
    durationMinutes: number,
    note?: string,
    category?: MedicationCategory,
    color?: string,
    repeatEveryHours?: number | null
  ) => void;
  isDark?: boolean;
}

const COMMON_MEDS = [
  'Blood Pressure',
  'Eye Drops',
  'Vitamin D',
  'Heart Pill',
  'Pain Relief',
  'Antibiotic',
  'Insulin',
];

const DURATION_PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
  { label: '6h', minutes: 360 },
  { label: '8h', minutes: 480 },
  { label: '12h', minutes: 720 },
];

const CATEGORIES: { key: MedicationCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'pill', label: 'Pill', icon: 'medical-outline' },
  { key: 'drops', label: 'Drops', icon: 'water-outline' },
  { key: 'capsule', label: 'Capsule', icon: 'fitness-outline' },
  { key: 'injection', label: 'Injection', icon: 'bandage-outline' },
  { key: 'general', label: 'General', icon: 'alarm-outline' },
];

const REPEAT_OPTIONS = [
  { label: 'Once', hours: null },
  { label: 'Every 4h', hours: 4 },
  { label: 'Every 6h', hours: 6 },
  { label: 'Every 8h', hours: 8 },
  { label: 'Every 12h', hours: 12 },
  { label: 'Daily (24h)', hours: 24 },
];

export const AddTimerModal: React.FC<AddTimerModalProps> = ({
  visible,
  onClose,
  onAddTimer,
  isDark = false,
}) => {
  const theme = isDark ? Colors.dark : Colors.light;

  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<MedicationCategory>('pill');
  const [durationMinutes, setDurationMinutes] = useState(240); // default 4 hours
  const [customHours, setCustomHours] = useState('4');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [repeatHours, setRepeatHours] = useState<number | null>(null);

  const handleSelectPresetDuration = (mins: number) => {
    setDurationMinutes(mins);
    setCustomHours(Math.floor(mins / 60).toString());
    setCustomMinutes((mins % 60).toString());
  };

  const handleCustomTimeChange = (hStr: string, mStr: string) => {
    const h = parseInt(hStr || '0', 10);
    const m = parseInt(mStr || '0', 10);
    const total = Math.max(h * 60 + m, 1);
    setDurationMinutes(total);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const catConfig = Colors.categories[category] || Colors.categories.pill;

    onAddTimer(
      trimmedName,
      durationMinutes,
      note.trim() || undefined,
      category,
      catConfig.color,
      repeatHours
    );

    // Reset fields
    setName('');
    setNote('');
    setCategory('pill');
    setDurationMinutes(240);
    setCustomHours('4');
    setCustomMinutes('0');
    setRepeatHours(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
              New Medicine Countdown
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* Quick Medicine Suggestions */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              QUICK MEDICINE NAMES
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {COMMON_MEDS.map((med) => (
                <TouchableOpacity
                  key={med}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: name === med ? theme.primaryLight : theme.badge,
                      borderColor: name === med ? theme.primary : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setName(med)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: name === med ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {med}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Custom Name Input */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              NAME *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="e.g. Mom: Blood Pressure Pill"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Dosage or Instructions Note */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              INSTRUCTIONS / DOSAGE (OPTIONAL)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="e.g. 1 pill with warm water after lunch"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
            />

            {/* Category Selector */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              CATEGORY
            </Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                const catConfig = Colors.categories[cat.key];
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: isSelected ? catConfig.bg : theme.background,
                        borderColor: isSelected ? catConfig.color : theme.cardBorder,
                      },
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={20}
                      color={isSelected ? catConfig.color : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryBtnLabel,
                        { color: isSelected ? catConfig.color : theme.textSecondary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Duration Presets */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              COUNTDOWN DURATION
            </Text>
            <View style={styles.presetGrid}>
              {DURATION_PRESETS.map((p) => {
                const isSelected = durationMinutes === p.minutes;
                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[
                      styles.presetButton,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.background,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => handleSelectPresetDuration(p.minutes)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Time Input (Hours & Minutes) */}
            <View style={styles.customTimeRow}>
              <View style={styles.customTimeInputContainer}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  keyboardType="numeric"
                  maxLength={2}
                  value={customHours}
                  onChangeText={(val) => {
                    setCustomHours(val);
                    handleCustomTimeChange(val, customMinutes);
                  }}
                />
                <Text style={[styles.timeUnitText, { color: theme.textSecondary }]}>
                  Hours
                </Text>
              </View>

              <Text style={[styles.colonText, { color: theme.textSecondary }]}>:</Text>

              <View style={styles.customTimeInputContainer}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  keyboardType="numeric"
                  maxLength={2}
                  value={customMinutes}
                  onChangeText={(val) => {
                    setCustomMinutes(val);
                    handleCustomTimeChange(customHours, val);
                  }}
                />
                <Text style={[styles.timeUnitText, { color: theme.textSecondary }]}>
                  Minutes
                </Text>
              </View>
            </View>

            {/* Auto-Repeat Option */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              AUTO-REPEAT SCHEDULE
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {REPEAT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: repeatHours === opt.hours ? theme.primaryLight : theme.badge,
                      borderColor: repeatHours === opt.hours ? theme.primary : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setRepeatHours(opt.hours)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: repeatHours === opt.hours ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: name.trim() ? theme.primary : theme.cardBorder,
                },
              ]}
              disabled={!name.trim()}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="timer-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Start Countdown</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  categoryBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: '22%',
    alignItems: 'center',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  customTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  customTimeInputContainer: {
    alignItems: 'center',
  },
  timeInput: {
    width: 68,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  timeUnitText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  colonText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
