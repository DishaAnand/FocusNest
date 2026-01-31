import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

class NotificationService {
  constructor() {
    // Configure notifications
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create default channel
    PushNotification.createChannel(
      {
        channelId: 'timer-channel',
        channelName: 'Timer Notifications',
        channelDescription: 'Notifications for timer completion',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  scheduleTimerNotification(seconds: number, mode: 'focus' | 'break') {
    // Cancel any existing notifications first
    PushNotification.cancelAllLocalNotifications();

    const title = mode === 'focus' ? 'Focus session complete!' : 'Break time is over!';
    const message = mode === 'focus' ? 'Time to take a break' : 'Ready to focus again?';

    PushNotification.localNotificationSchedule({
      channelId: 'timer-channel',
      title: title,
      message: message,
      date: new Date(Date.now() + seconds * 1000), // When to fire
      playSound: true,
      soundName: 'default',
      allowWhileIdle: true,
      invokeApp: true,
    });

    console.log(`✅ Notification scheduled for ${seconds} seconds from now`);
  }

  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
    console.log('🚫 All notifications cancelled');
  }
}

export default new NotificationService();