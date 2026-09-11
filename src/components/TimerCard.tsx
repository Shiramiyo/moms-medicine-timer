import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountdownTimer, MedicationCategory } from '../types/timer';
import { Colors } from '../theme/colors';
import {
  formatSecondsToDigital,
  calculateRemainingSeconds,
  calculateProgress,
} from '../utils/timeUtils';

interface TimerCardProps {
  timer: CountdownTimer;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onReset: (id: string) => void;
  onMarkAsTaken: (id: string) => void;
  onDelete: (id: string) => void;
  isDark?: boolean;
}

const CATEGORY_ICONS: Record<MedicationCategory, keyof typeof Ionicons.glyphMap> = {
  pill: 'medical-outline',
  drops: 'water-outline',
  capsule: 'fitness-outline',
  injection: 'bandage-outline',
  general: 'alarm-outline',
};

export const TimerCard: React.FC<TimerCardProps> = ({
  timer,
  onPause,
  onResume,
  onSnooze,
  onReset,
  onMarkAsTaken,
  onDelete,
  isDark = false,
}) => {
  const theme = isDark ? Colors.dark : Colors.light;
  const categoryConfig = Colors.categories[timer.category] || Colors.categories.pill;

  const remainingSeconds = calculateRemainingSeconds(
    timer.status,
    timer.targetTimestamp,
    timer.pausedRemainingSeconds
  );

  const progress = calculateProgress(timer.durationSeconds, remainingSeconds);
  const isCompleted = timer.status === 'completed' || (timer.status === 'running' && remainingSeconds === 0);
  const isRunning = timer.status === 'running' && !isCompleted;

  const cardBorderColor = isCompleted
    ? theme.accentDanger
    : isRunning
    ? theme.primary
    : theme.cardBorder;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: cardBorderColor,
          borderWidth: isCompleted || isRunning ? 1.5 : 1,
        },
      ]}
    >
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.tagsContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.bg }]}>
            <Ionicons
              name={CATEGORY_ICONS[timer.category]}
              size={13}
              color={categoryConfig.color}
            />
            <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
              {categoryConfig.label}
            </Text>
          </View>

          {timer.repeatEveryHours ? (
            <View style={[styles.repeatBadge, { backgroundColor: theme.badge }]}>
              <Ionicons name="repeat-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.repeatText, { color: theme.textSecondary }]}>
                Every {timer.repeatEveryHours}h
              </Text>
            </View>
          ) : null}

          {isCompleted && (
            <View style={[styles.dueBadge, { backgroundColor: theme.accentDangerLight }]}>
              <Text style={[styles.dueBadgeText, { color: theme.accentDanger }]}>
                TIME TO TAKE!
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onDelete(timer.id)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Title & Notes */}
      <View style={styles.contentSection}>
        <Text style={[styles.timerTitle, { color: theme.textPrimary }]}>
          {timer.name}
        </Text>
        {timer.note ? (
          <Text style={[styles.timerNote, { color: theme.textSecondary }]}>
            {timer.note}
          </Text>
        ) : null}
      </View>

      {/* Countdown Digits */}
      <View style={styles.countdownContainer}>
        <Text
          style={[
            styles.digitalTime,
            {
              color: isCompleted
                ? theme.accentDanger
                : isRunning
                ? theme.textPrimary
                : theme.textSecondary,
            },
          ]}
        >
          {formatSecondsToDigital(remainingSeconds)}
        </Text>
        <Text style={[styles.statusSubtext, { color: theme.textMuted }]}>
          {isCompleted ? 'Dose due now' : isRunning ? 'Remaining' : 'Paused'}
        </Text>
      </View>

      {/* Sleek Progress Bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.separator }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: isCompleted
                ? theme.accentDanger
                : isRunning
                ? timer.color || theme.primary
                : theme.textMuted,
            },
          ]}
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {/* Primary Action: Mark as Taken */}
        <TouchableOpacity
          style={[
            styles.takenButton,
            {
              backgroundColor: isCompleted ? theme.accentSuccess : theme.primaryLight,
            },
          ]}
          onPress={() => onMarkAsTaken(timer.id)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={isCompleted ? '#FFFFFF' : theme.primary}
          />
          <Text
            style={[
              styles.takenButtonText,
              { color: isCompleted ? '#FFFFFF' : theme.primary },
            ]}
          >
            Mark Taken
          </Text>
        </TouchableOpacity>

        {/* Secondary Action: Play / Pause */}
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.badge, borderColor: theme.cardBorder }]}
            onPress={() => (isRunning ? onPause(timer.id) : onResume(timer.id))}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={16}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
        )}

        {/* Snooze +10m */}
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: theme.badge, borderColor: theme.cardBorder }]}
          onPress={() => onSnooze(timer.id, 10)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={16} color={theme.textPrimary} />
          <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
            +10m
          </Text>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: theme.badge, borderColor: theme.cardBorder }]}
          onPress={() => onReset(timer.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  repeatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 4,
  },
  contentSection: {
    marginBottom: 12,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  timerNote: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  countdownContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  digitalTime: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  statusSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  takenButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    gap: 6,
    paddingHorizontal: 12,
  },
  takenButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    minWidth: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
