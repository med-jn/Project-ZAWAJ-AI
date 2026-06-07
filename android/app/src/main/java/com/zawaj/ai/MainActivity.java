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
    private String pendingRoute = null;

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

        pendingRoute = extractRoute(getIntent());
    }

    @Override
    public void onStart() {
        super.onStart();
        if (pendingRoute != null) {
            final String route = pendingRoute;
            pendingRoute = null;
            // ✅ تأخير 2.5 ثانية لضمان اكتمال تحميل الـ session في Next.js
            new Handler(Looper.getMainLooper()).postDelayed(() -> navigateTo(route), 2500);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String route = extractRoute(intent);
        if (route != null) navigateTo(route);
    }

    private void navigateTo(final String route) {
        final String targetUrl = BASE_URL + route;

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() ->
                getBridge().getWebView().loadUrl(targetUrl)
            );
            return;
        }

        final Handler handler = new Handler(Looper.getMainLooper());
        final int[] attempts = {0};
        final Runnable[] retry = {null};
        retry[0] = () -> {
            attempts[0]++;
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() ->
                    getBridge().getWebView().loadUrl(targetUrl)
                );
            } else if (attempts[0] < 15) {
                handler.postDelayed(retry[0], 200);
            }
        };
        handler.postDelayed(retry[0], 200);
    }

    private String extractRoute(Intent intent) {
        if (intent == null) return null;

        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            return route.startsWith("/") ? route : "/" + route;
        }

        Uri data = intent.getData();
        if (data != null && "zawaj".equals(data.getScheme()) && "app".equals(data.getHost())) {
            String path  = data.getPath();
            String query = data.getQuery();
            if (path != null && !path.isEmpty()) {
                return (query != null && !query.isEmpty()) ? path + "?" + query : path;
            }
        }

        return null;
    }
}
