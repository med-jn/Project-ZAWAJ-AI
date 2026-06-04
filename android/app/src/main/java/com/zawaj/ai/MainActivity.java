package com.zawaj.ai;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.BridgeActivity;

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

        // تأخير بسيط لضمان جاهزية Capacitor WebView
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
        }, 600);
    }

    /**
     * ✅ Extra "route" فقط — بسيط وموثوق
     * MyFirebaseMessagingService يضعه بـ intent.putExtra("route", route)
     * بدون setData() الذي كان يسبب مشاكل
     */
    private String extractRoute(Intent intent) {
        // 1. Extra مباشر من FCM
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            return route.startsWith("/") ? route : "/" + route;
        }

        // 2. fallback: URI من Deep Link القديم zawaj://app/...
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
