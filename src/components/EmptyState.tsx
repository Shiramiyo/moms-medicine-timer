import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { DEFAULT_PRESETS } from '../services/storageService';
import { MedicationCategory } from '../types/timer';

interface EmptyStateProps {
  onAddFromPreset: (
    name: string,
    durationMinutes: number,
    note?: string,
    category?: MedicationCategory,
    color?: string
  ) => void;
  onOpenAddModal: () => void;
  isDark?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAddFromPreset,
  onOpenAddModal,
  isDark = false,
}) => {
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
        <Ionicons name="timer-outline" size={40} color={theme.primary} />
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>
        No Active Countdowns
      </Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Create a custom timer for your mom's medicine, or tap one of the common presets below to start immediately.
      </Text>

      {/* Preset Quick Start */}
      <View style={styles.presetsContainer}>
        <Text style={[styles.presetsTitle, { color: theme.textMuted }]}>
          QUICK START PRESETS
        </Text>
        {DEFAULT_PRESETS.map((preset) => {
          const catConfig = Colors.categories[preset.category] || Colors.categories.pill;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() =>
                onAddFromPreset(
                  preset.name,
                  preset.durationMinutes,
                  preset.note,
                  preset.category,
                  catConfig.color
                )
              }
              activeOpacity={0.7}
            >
              <View style={[styles.presetIcon, { backgroundColor: catConfig.bg }]}>
                <Ionicons name="medical-outline" size={16} color={catConfig.color} />
              </View>

              <View style={styles.presetTextContainer}>
                <Text style={[styles.presetName, { color: theme.textPrimary }]}>
                  {preset.name}
                </Text>
                <Text style={[styles.presetDuration, { color: theme.textSecondary }]}>
                  {preset.durationMinutes >= 60
                    ? `${preset.durationMinutes / 60} hours`
                    : `${preset.durationMinutes} mins`}
                  {preset.note ? ` • ${preset.note}` : ''}
                </Text>
              </View>

              <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.customButton, { backgroundColor: theme.primary }]}
        onPress={onOpenAddModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.customButtonText}>Create Custom Countdown</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 320,
  },
  presetsContainer: {
    width: '100%',
    marginBottom: 24,
    gap: 8,
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: 'left',
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  presetIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetTextContainer: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 6,
    width: '100%',
  },
  customButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
