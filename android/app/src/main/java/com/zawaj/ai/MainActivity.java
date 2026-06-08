package com.zawaj.ai;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

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
        if (route != null) saveRoute(route);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String route = extractRoute(intent);
        if (route != null) saveRoute(route);
    }

    // ✅ يحفظ الـ route في نفس SharedPreferences التي يقرأها @capacitor/preferences
    // المفتاح: "CapacitorStorage.pending_route"
    private void saveRoute(String route) {
        getSharedPreferences("CapacitorStorage", MODE_PRIVATE)
            .edit()
            .putString("pending_route", route)
            .apply();
    }

    private String extractRoute(Intent intent) {
        if (intent == null) return null;

        // Extra من FCM notification
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            return route.startsWith("/") ? route : "/" + route;
        }

        // fallback: URI
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
