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
 * يستقبل Deep Links من الإشعارات ويوجّه الـ WebView
 * داخل التطبيق (https://localhost) وليس للمتصفح الخارجي.
 *
 * URI format من MyFirebaseMessagingService:
 *   zawaj://app?route=/chat%3Fid%3Dxxx
 *
 * extractRoute يفكّ الترميز ويعيد: /chat?id=xxx
 */
public class MainActivity extends BridgeActivity {

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
     * استخراج route من Intent بالأولوية:
     *
     * 1. URI من الإشعار: zawaj://app?route=/chat%3Fid%3Dxxx
     *    → نقرأ query param "route" ونفكّ ترميزه
     *    → يعيد: /chat?id=xxx
     *
     * 2. Extra "route" مباشر (fallback للحالات القديمة)
     */
    private String extractRoute(Intent intent) {

        Uri data = intent.getData();
        if (data != null && "zawaj".equals(data.getScheme()) && "app".equals(data.getHost())) {

            // 1. قراءة route من query parameter
            String routeParam = data.getQueryParameter("route");
            if (routeParam != null && !routeParam.isEmpty()) {
                // Uri.getQueryParameter يفكّ الترميز تلقائياً
                return routeParam.startsWith("/") ? routeParam : "/" + routeParam;
            }

            // 2. fallback: path مباشر zawaj://app/chat → /chat
            // (بدون query string — لن يعمل مع ?id= لكن أفضل من لا شيء)
            String path  = data.getPath();
            String query = data.getQuery();
            if (path != null && !path.isEmpty()) {
                return (query != null && !query.isEmpty()) ? path + "?" + query : path;
            }
        }

        // 3. Extra مباشر (fallback)
        String routeExtra = intent.getStringExtra("route");
        if (routeExtra != null && !routeExtra.isEmpty()) {
            return routeExtra.startsWith("/") ? routeExtra : "/" + routeExtra;
        }

        return null;
    }
}
