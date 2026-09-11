import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure foreground notification presentation (crucial for iOS)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medicine-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

export async function scheduleMedicationNotification(
  timerId: string,
  name: string,
  note: string | undefined,
  secondsFromNow: number
): Promise<string | null> {
  if (secondsFromNow <= 0) return null;

  try {
    if (Platform.OS === 'web') {
      // For web, if permitted, we schedule via setTimeout if tab is open
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        setTimeout(() => {
          new window.Notification(`💊 Mom's Medicine: ${name}`, {
            body: note || 'Time for medicine!',
          });
        }, secondsFromNow * 1000);
      }
      return `web-${Date.now()}`;
    }

    // Schedule native iOS / Android local notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Mom's Medicine: ${name}`,
        body: note
          ? `${note} — Please make sure she takes it now.`
          : `Countdown complete! Please give her the medicine now.`,
        sound: true,
        data: { timerId },
        categoryIdentifier: 'MEDICATION_ALARM',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(Math.round(secondsFromNow), 1),
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
    return null;
  }
}

export async function cancelMedicationNotification(notificationId?: string | null): Promise<void> {
  if (!notificationId) return;
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel all notifications:', error);
  }
}
