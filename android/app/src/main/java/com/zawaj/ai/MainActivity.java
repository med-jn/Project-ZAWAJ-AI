package com.zawaj.ai;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — ZAWAJ AI
 *
 * لا نستخدم loadUrl() إطلاقاً — يُعيد تحميل WebView ويمر بـ app/page.tsx
 * التي تُوجّه لـ /home وتتجاهل الـ route المطلوب.
 *
 * الحل: نكتب الـ route في SharedPreferences تحت اسم "CapacitorStorage"
 * بالمفتاح "CapacitorStorage.pending_route" — وهو نفس المكان الذي
 * يقرأ منه Capacitor Preferences في JS بـ:
 *   Preferences.get({ key: 'pending_route' })
 *
 * ثم app/page.tsx يقرأ الـ route ويتوجه إليه بعد التحقق من الـ session.
 */
public class MainActivity extends BridgeActivity {

    // نفس اسم SharedPreferences الذي يستخدمه Capacitor Preferences plugin
    private static final String CAP_PREFS = "CapacitorStorage";
    private static final String ROUTE_KEY = "CapacitorStorage.pending_route";

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

        saveRouteFromIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        saveRouteFromIntent(intent);
    }

    private void saveRouteFromIntent(Intent intent) {
        if (intent == null) return;
        String route = extractRoute(intent);
        if (route == null) return;

        // نكتب في نفس SharedPreferences التي يقرأ منها Capacitor Preferences
        getSharedPreferences(CAP_PREFS, MODE_PRIVATE)
            .edit()
            .putString(ROUTE_KEY, route)
            .apply();
    }

    private String extractRoute(Intent intent) {
        if (intent == null) return null;

        // 1. Extra من FCM
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            return normalizeRoute(route);
        }

        // 2. Deep link: zawaj://app/chat?id=xxx
        Uri data = intent.getData();
        if (data != null
                && "zawaj".equals(data.getScheme())
                && "app".equals(data.getHost())) {
            String path  = data.getPath();
            String query = data.getQuery();
            if (path != null && !path.isEmpty()) {
                String r = (query != null && !query.isEmpty())
                    ? path + "?" + query
                    : path;
                return normalizeRoute(r);
            }
        }

        return null;
    }

    /**
     * /chat?id=X   →  /chat/?id=X
     * chat/?id=X   →  /chat/?id=X
     */
    private String normalizeRoute(String route) {
        if (route == null || route.isEmpty()) return null;
        if (!route.startsWith("/")) route = "/" + route;
        if (route.contains("?") && !route.contains("/?")) {
            route = route.replace("?", "/?");
        }
        return route;
    }
}