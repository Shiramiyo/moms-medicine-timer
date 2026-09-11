import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicationLogEntry, MedicationCategory } from '../types/timer';
import { Colors } from '../theme/colors';
import { formatDateTime } from '../utils/timeUtils';

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  history: MedicationLogEntry[];
  onClearHistory: () => void;
  isDark?: boolean;
}

const CATEGORY_ICONS: Record<MedicationCategory, keyof typeof Ionicons.glyphMap> = {
  pill: 'medical-outline',
  drops: 'water-outline',
  capsule: 'fitness-outline',
  injection: 'bandage-outline',
  general: 'alarm-outline',
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
  visible,
  onClose,
  history,
  onClearHistory,
  isDark = false,
}) => {
  const theme = isDark ? Colors.dark : Colors.light;

  const handleConfirmClear = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all medication history logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: onClearHistory },
      ]
    );
  };

  const renderItem = ({ item }: { item: MedicationLogEntry }) => {
    const catConfig = Colors.categories[item.category] || Colors.categories.pill;
    return (
      <View
        style={[
          styles.logCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: catConfig.bg }]}>
          <Ionicons
            name={CATEGORY_ICONS[item.category]}
            size={18}
            color={catConfig.color}
          />
        </View>

        <View style={styles.logInfo}>
          <Text style={[styles.logTitle, { color: theme.textPrimary }]}>
            {item.name}
          </Text>
          {item.note ? (
            <Text style={[styles.logNote, { color: theme.textSecondary }]}>
              {item.note}
            </Text>
          ) : null}
          <View style={styles.timestampRow}>
            <Ionicons name="checkmark-done" size={14} color={theme.accentSuccess} />
            <Text style={[styles.timestampText, { color: theme.textMuted }]}>
              Taken {formatDateTime(item.takenAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: theme.cardBorder }]}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Doses Taken Log
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                {history.length} doses recorded
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              {history.length > 0 && (
                <TouchableOpacity
                  onPress={handleConfirmClear}
                  style={styles.clearButton}
                >
                  <Text style={[styles.clearButtonText, { color: theme.accentDanger }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* List or Empty State */}
          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.badge }]}>
                <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No doses logged yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Whenever you tap "Mark Taken" on a countdown card, it will be safely recorded here so you can verify anytime.
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
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
    height: '80%',
    paddingTop: 18,
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
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 20,
    gap: 10,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  logNote: {
    fontSize: 12,
    marginTop: 2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
