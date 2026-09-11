import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface HeaderProps {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenAddModal: () => void;
  isDark?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  historyCount,
  onOpenHistory,
  onOpenAddModal,
  isDark = false,
}) => {
  const theme = isDark ? Colors.dark : Colors.light;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { borderBottomColor: theme.cardBorder }]}>
      <View style={styles.leftContainer}>
        <Text style={[styles.dateText, { color: theme.textMuted }]}>
          {todayStr.toUpperCase()}
        </Text>
        <Text style={[styles.titleText, { color: theme.textPrimary }]}>
          Mom's Medicine
        </Text>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={onOpenHistory}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={20} color={theme.textPrimary} />
          {historyCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{historyCount > 9 ? '9+' : historyCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={onOpenAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  leftContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
