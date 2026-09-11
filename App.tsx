import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTimers } from './src/hooks/useTimers';
import { Header } from './src/components/Header';
import { TimerCard } from './src/components/TimerCard';
import { AddTimerModal } from './src/components/AddTimerModal';
import { HistoryModal } from './src/components/HistoryModal';
import { EmptyState } from './src/components/EmptyState';
import { Colors } from './src/theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [needsWebPermission, setNeedsWebPermission] = useState(false);
  const [showPwaTip, setShowPwaTip] = useState(false);

  const {
    timers,
    history,
    isLoaded,
    isCloudSynced,
    addTimer,
    pauseTimer,
    resumeTimer,
    snoozeTimer,
    resetTimer,
    markAsTaken,
    deleteTimer,
    clearHistory,
  } = useTimers();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const isIos = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
      const isStandaloneMode = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
      if (isIos && !isStandaloneMode) {
        setShowPwaTip(true);
      }
      if ('Notification' in window && window.Notification.permission !== 'granted') {
        setNeedsWebPermission(true);
      }
    }
  }, []);

  const handleEnableAlerts = async () => {
    const { playAlarmSound } = await import('./src/services/soundService');
    playAlarmSound();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await window.Notification.requestPermission();
      if (perm === 'granted') {
        setNeedsWebPermission(false);
      }
    }
  };

  // Listen to incoming notifications and user responses
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const timerId = response.notification.request.content.data?.timerId;
        if (timerId) {
          console.log('User tapped notification for timer:', timerId);
        }
      }
    );

    return () => subscription.remove();
  }, []);

  const completedCount = timers.filter(
    (t) => t.status === 'completed' || (t.status === 'running' && t.targetTimestamp && Date.now() >= t.targetTimestamp)
  ).length;

  const runningCount = timers.filter(
    (t) => t.status === 'running' && (!t.targetTimestamp || Date.now() < t.targetTimestamp)
  ).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <Header
        historyCount={history.length}
        onOpenHistory={() => setHistoryModalVisible(true)}
        onOpenAddModal={() => setAddModalVisible(true)}
        isDark={isDark}
      />

      {/* Web Notification & Sound Permission Prompt */}
      {needsWebPermission && (
        <TouchableOpacity
          style={[styles.webBanner, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
          onPress={handleEnableAlerts}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={20} color={theme.primary} />
          <View style={styles.webBannerTextContainer}>
            <Text style={[styles.webBannerTitle, { color: theme.primary }]}>
              Enable Sound & Alerts
            </Text>
            <Text style={[styles.webBannerSub, { color: theme.textSecondary }]}>
              Tap here so your phone can chime and show alerts when timers end.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
        </TouchableOpacity>
      )}

      {/* iOS Safari Home Screen Tip */}
      {showPwaTip && (
        <View style={[styles.tipBanner, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Ionicons name="phone-portrait-outline" size={18} color={theme.textPrimary} />
          <Text style={[styles.tipBannerText, { color: theme.textSecondary }]}>
            Tip: Tap <Text style={{ fontWeight: '700' }}>Share ⬆️</Text> then <Text style={{ fontWeight: '700' }}>"Add to Home Screen"</Text> to install as an iPhone app!
          </Text>
          <TouchableOpacity onPress={() => setShowPwaTip(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Due Now Alert Banner if any countdown reached zero */}
      {completedCount > 0 && (
        <View style={[styles.dueBanner, { backgroundColor: theme.accentDangerLight, borderColor: theme.accentDanger }]}>
          <Ionicons name="alert-circle" size={20} color={theme.accentDanger} />
          <View style={styles.dueBannerTextContainer}>
            <Text style={[styles.dueBannerTitle, { color: theme.accentDanger }]}>
              {completedCount === 1 ? '1 Medicine is Due Now!' : `${completedCount} Medicines are Due Now!`}
            </Text>
            <Text style={[styles.dueBannerSub, { color: theme.textSecondary }]}>
              Please check on your mom and tap "Mark Taken" once given.
            </Text>
          </View>
        </View>
      )}

      {/* Quick Summary Pill Bar */}
      {timers.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryPill}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              {runningCount} Running
            </Text>
          </View>
          {completedCount > 0 && (
            <View style={styles.summaryPill}>
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                {completedCount} Due
              </Text>
            </View>
          )}
          <View style={styles.summaryPill}>
            <View style={[styles.dot, { backgroundColor: '#6366F1' }]} />
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              {timers.length} Total
            </Text>
          </View>
          {isCloudSynced && (
            <View style={[styles.summaryPill, { marginLeft: 'auto' }]}>
              <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.summaryText, { color: '#10B981', fontWeight: '700' }]}>
                Family Sync
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Timers List or Empty State */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isLoaded ? null : timers.length === 0 ? (
          <EmptyState
            onAddFromPreset={addTimer}
            onOpenAddModal={() => setAddModalVisible(true)}
            isDark={isDark}
          />
        ) : (
          timers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              onPause={pauseTimer}
              onResume={resumeTimer}
              onSnooze={snoozeTimer}
              onReset={resetTimer}
              onMarkAsTaken={markAsTaken}
              onDelete={deleteTimer}
              isDark={isDark}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <AddTimerModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAddTimer={addTimer}
        isDark={isDark}
      />

      <HistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        history={history}
        onClearHistory={clearHistory}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  dueBannerTextContainer: {
    flex: 1,
  },
  dueBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  dueBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  webBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  webBannerTextContainer: {
    flex: 1,
  },
  webBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  webBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tipBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
