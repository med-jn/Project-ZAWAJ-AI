package com.zawaj.ai;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * ZAWAJ AI — MainActivity
 *
 * Deep Link flow:
 *   MyFirebaseMessagingService يبني PendingIntent بـ:
 *     intent.putExtra("route", "/chat?id=xxx")
 *     intent.setData(Uri.parse("zawaj://app/chat?id=xxx"))
 *
 *   MainActivity يستقبل الـ Intent في onCreate / onNewIntent
 *   ويوجّه الـ WebView للمسار الصحيح داخل zawaj.orcaup.com
 */
public class MainActivity extends BridgeActivity {

    // URL الإنتاج الرسمي — جميع التوجيهات تذهب هنا
    private static final String BASE_URL = "https://zawaj.orcaup.com";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // لون شريط التنقل
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setNavigationBarColor(Color.parseColor("#080008"));
        }

        // توجيه من إشعار (التطبيق كان مغلقاً)
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // توجيه من إشعار (التطبيق كان في الخلفية)
        handleDeepLink(intent);
    }

    /**
     * استخراج المسار من الـ Intent وتوجيه الـ WebView
     *
     * مصادر الـ route بالأولوية:
     * 1. Extra "route" من FCM data (مثال: /chat?id=xxx)
     * 2. URI data من Intent (مثال: zawaj://app/chat?id=xxx)
     */
    private void handleDeepLink(Intent intent) {
        if (intent == null) return;

        String route = extractRoute(intent);
        if (route == null || route.isEmpty()) return;

        final String targetUrl = BASE_URL + route;

        // نؤخر التوجيه حتى يصبح الـ WebView جاهزاً
        // getBridge() قد يكون null في onCreate قبل اكتمال Capacitor
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() ->
                        getBridge().getWebView().loadUrl(targetUrl)
                    );
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 800); // 800ms تكفي لـ Capacitor للاستعداد
    }

    /**
     * استخراج route بالأولوية:
     * 1. Extra "route" مباشرة من FCM data
     * 2. URI scheme zawaj://app → نستخرج path+query
     */
    private String extractRoute(Intent intent) {
        // 1. Extra مباشر (الأكثر موثوقية)
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            // نتأكد أنه يبدأ بـ /
            return route.startsWith("/") ? route : "/" + route;
        }

        // 2. URI من Deep Link: zawaj://app/chat?id=xxx
        Uri data = intent.getData();
        if (data != null && "zawaj".equals(data.getScheme()) && "app".equals(data.getHost())) {
            String path  = data.getPath();   // /chat أو /view
            String query = data.getQuery();  // id=xxx
            if (path != null && !path.isEmpty()) {
                return (query != null && !query.isEmpty())
                    ? path + "?" + query
                    : path;
            }
        }

        return null;
    }
}
