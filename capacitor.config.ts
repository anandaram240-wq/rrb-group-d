import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rrbgroupd.mastery',
  appName: 'RRB Group D',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      '*.googleapis.com',
      '*.firebaseio.com',
      '*.firebaseapp.com',
      'firestore.googleapis.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2200,
      backgroundColor: '#1a365d',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#60a5fa',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark' as any,
      backgroundColor: '#1a365d',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body' as any,
      style: 'dark' as any,
      resizeOnFullScreen: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: 'rrb-release.keystore',
      keystorePassword: 'rrbgroupd2024',
      keystoreAlias: 'rrbgroupd',
      keystoreAliasPassword: 'rrbgroupd2024',
      releaseType: 'APK',
      signingType: 'apksigner',
    },
  },
};

export default config;
