import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',   // ← لا يُستخدم فعلياً (server.url له الأولوية) لكن مطلوب لـ cap sync

  server: {
    // ✅ يحمّل من Vercel مباشرة — تحديث فوري عند كل deploy
    url:           'https://zawaj-ai.vercel.app',
    androidScheme: 'https',
    cleartext:     false,
  },

  plugins: {

    // ── المتصفح الداخلي ────────────────────────────────────
    Browser: {
      presentationStyle: 'popover',
    },

    // ── شريط الحالة (Status Bar) ───────────────────────────
    // اللون يتطابق مع خلفية التطبيق bg-luxury-gradient
    StatusBar: {
      style:           'DARK',        // نص أبيض على شريط الحالة
      backgroundColor: '#0a0a0f',     // لون خلفية التطبيق
      overlaysWebView: false,         // الشريط فوق الـ WebView لا تحته
    },

    // ── لوحة المفاتيح ──────────────────────────────────────
    Keyboard: {
      resize:           'body',       // الصفحة تتقلص عند ظهور الكيبورد
      style:            'DARK',
      resizeOnFullScreen: true,
    },

    // ── الشاشة البيضاء (Splash) ────────────────────────────
    SplashScreen: {
      launchShowDuration:   1500,
      launchAutoHide:       true,
      backgroundColor:      '#0a0a0f',
      androidSplashResourceName: 'splash',
      showSpinner:          false,
    },

  },

  // ── إعدادات Android ────────────────────────────────────────
  android: {
    // منع لقطات الشاشة في الصفحات الحساسة (اختياري)
    // allowMixedContent: false,
    captureInput:    true,     // تسجيل المدخلات بشكل صحيح
    webContentsDebuggingEnabled: false,  // false في الإنتاج
  },

};

export default config;