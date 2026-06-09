package com.zawaj.ai;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // ✅ نفس اسم الـ SharedPreferences الذي يستخدمه @capacitor/preferences
    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String ROUTE_KEY  = "pending_route";

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

        String route = extractRoute(getIntent());
        if (route != null) {
            savePendingRoute(route);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String route = extractRoute(intent);
        if (route != null) {
            savePendingRoute(route);
        }
    }

    private void savePendingRoute(String route) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        prefs.edit().putString(ROUTE_KEY, route).apply();
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
