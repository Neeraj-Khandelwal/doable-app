import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doable.app',
  appName: 'Doable',
  webDir: 'dist',
  plugins: {
    App: {
      url: ['doable://', 'https://app.doable.com'],
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#7C3AED',
      sound: 'beep.wav',
    },
  },
};

export default config;
