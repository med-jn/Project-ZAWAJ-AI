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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        // معالجة الـ Intent بعد جاهزية Bridge
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(final Intent intent) {
        if (intent == null) return;
        final String route = extractRoute(intent);
        if (route == null) return;

        // ✅ نحمّل URL كاملاً في WebView مباشرة
        // هذا يتجاوز Next.js router ويحمّل الصفحة مباشرة
        final String url = BASE_URL + route;

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() ->
                    getBridge().getWebView().loadUrl(url)
                );
            }
        }, 1000);
    }

    private String extractRoute(Intent intent) {
        if (intent == null) return null;

        // 1. Extra من FCM
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            // ✅ تأكد من slash قبل ? مثل /view/?id=xxx
            if (route.contains("?") && !route.contains("/?")) {
                route = route.replace("?", "/?");
            }
            return route.startsWith("/") ? route : "/" + route;
        }

        // 2. URI fallback
        Uri data = intent.getData();
        if (data != null && "zawaj".equals(data.getScheme()) && "app".equals(data.getHost())) {
            String path  = data.getPath();
            String query = data.getQuery();
            if (path != null && !path.isEmpty()) {
                String r = (query != null && !query.isEmpty()) ? path + "/?" + query : path;
                return r;
            }
        }

        return null;
    }
}
