package com.zawaj.ai;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String BASE_URL  = "https://localhost";
    private static final String PREFS     = "zawaj_prefs";
    private static final String KEY_ROUTE = "pending_route";

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

        // ✅ حفظ الـ route من الإشعار في SharedPreferences
        String route = extractRoute(getIntent());
        if (route != null) {
            saveRoute(route);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        // ✅ بعد جاهزية WebView — نحقن الـ route كـ JS variable
        // usePushNotifications.ts سيقرأه بعد اكتمال الـ session
        injectPendingRoute();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String route = extractRoute(intent);
        if (route != null) {
            // التطبيق في الخلفية — WebView جاهز، ننتقل مباشرة
            saveRoute(route);
            injectPendingRoute();
        }
    }

    // ✅ يحقن الـ route في window.__pendingRoute لقراءته من JS
    private void injectPendingRoute() {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        final String route = prefs.getString(KEY_ROUTE, null);
        if (route == null) return;

        final Handler handler = new Handler(Looper.getMainLooper());
        final int[] attempts = {0};
        final Runnable[] retry = {null};

        retry[0] = () -> {
            attempts[0]++;
            WebView webView = (getBridge() != null) ? getBridge().getWebView() : null;
            if (webView != null) {
                // نحقن الـ route — لا نحذفه من SharedPreferences هنا
                // usePushNotifications.ts سيحذفه بعد القراءة
                webView.evaluateJavascript(
                    "window.__pendingRoute = '" + route.replace("'", "\\'") + "';",
                    null
                );
            } else if (attempts[0] < 20) {
                handler.postDelayed(retry[0], 200);
            }
        };
        handler.postDelayed(retry[0], 300);
    }

    private void saveRoute(String route) {
        getSharedPreferences(PREFS, MODE_PRIVATE)
            .edit()
            .putString(KEY_ROUTE, route)
            .apply();
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
