package com.zawaj.ai;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.BridgeActivity;

/**
 * ZAWAJ AI — MainActivity
 *
 * Deep Link flow:
 *   MyFirebaseMessagingService يبني PendingIntent بـ:
 *     intent.putExtra("route", "/chat?id=xxx")
 *
 *   MainActivity يستقبل الـ Intent ويوجّه الـ WebView
 *   إلى https://localhost/... (Capacitor server)
 *   وليس إلى zawaj.orcaup.com الذي يفتح المتصفح
 */
public class MainActivity extends BridgeActivity {

    // ✅ Capacitor يخدم التطبيق على https://localhost
    // لا تستخدم zawaj.orcaup.com — يفتح المتصفح الخارجي
    private static final String BASE_URL = "https://localhost";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setNavigationBarColor(Color.parseColor("#080008"));
        }

        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;

        final String route = extractRoute(intent);
        if (route == null || route.isEmpty()) return;

        final String targetUrl = BASE_URL + route;

        // نؤخر التوجيه حتى يصبح Capacitor WebView جاهزاً
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() ->
                        getBridge().getWebView().loadUrl(targetUrl)
                    );
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 800);
    }

    /**
     * استخراج route بالأولوية:
     * 1. Extra "route" مباشرة من FCM data payload
     * 2. URI من Deep Link: zawaj://app/chat?id=xxx
     */
    private String extractRoute(Intent intent) {
        // 1. Extra مباشر — الأكثر موثوقية
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            return route.startsWith("/") ? route : "/" + route;
        }

        // 2. URI من Deep Link
        Uri data = intent.getData();
        if (data != null
                && "zawaj".equals(data.getScheme())
                && "app".equals(data.getHost())) {
            String path  = data.getPath();
            String query = data.getQuery();
            if (path != null && !path.isEmpty()) {
                return (query != null && !query.isEmpty())
                    ? path + "?" + query
                    : path;
            }
        }

        return null;
    }
}