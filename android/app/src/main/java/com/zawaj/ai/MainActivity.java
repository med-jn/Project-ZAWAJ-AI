package com.zawaj.ai;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — ZAWAJ AI
 *
 * الحل النهائي لـ Cold Start:
 * نقرأ الـ URI من Intent ونُعيد توجيه WebView مباشرة
 * بعد تحميل الصفحة الرئيسية.
 *
 * التسلسل:
 * 1. التطبيق يبدأ من /
 * 2. page.tsx يفحص session ويتوجه لـ /home
 * 3. لكن قبل ذلك — نُطلق JavaScript يحفظ الـ route
 * 4. page.tsx يقرأ window.__pendingRoute ويتوجه إليه
 */
public class MainActivity extends BridgeActivity {

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
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // Warm Start: نُطلق JavaScript مباشرة
        String route = extractRoute(intent);
        if (route != null && getBridge() != null) {
            final String r = route;
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.__navigateTo && window.__navigateTo('" + r.replace("'", "\\'") + "')",
                    null
                )
            );
        }
    }

    @Override
    public void onStart() {
        super.onStart();

        // Cold Start: بعد تهيئة Bridge، نضع الـ route في window
        if (pendingRoute != null && getBridge() != null) {
            final String r = pendingRoute;
            pendingRoute = null;
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.__pendingRoute = '" + r.replace("'", "\\'") + "'",
                    null
                )
            );
        }
    }

    private String extractRoute(Intent intent) {
        if (intent == null) return null;

        // 1. من URI (deep link)
        Uri data = intent.getData();
        if (data != null && "zawaj".equals(data.getScheme()) && "app".equals(data.getHost())) {
            String path  = data.getPath()  != null ? data.getPath()  : "/";
            String query = data.getQuery() != null ? data.getQuery() : "";
            String route = query.isEmpty() ? path : path + "?" + query;
            return normalizeRoute(route);
        }

        // 2. من extra (fallback)
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            return normalizeRoute(route);
        }

        return null;
    }

    private String normalizeRoute(String route) {
        if (route == null || route.isEmpty()) return null;
        if (!route.startsWith("/")) route = "/" + route;
        if (route.contains("?") && !route.contains("/?")) {
            route = route.replace("?", "/?");
        }
        return route;
    }
}