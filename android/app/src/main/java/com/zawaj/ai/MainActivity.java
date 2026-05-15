package com.zawaj.ai;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── لون شريط التنقل السفلي ─────────────────────────
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setNavigationBarColor(Color.parseColor("#080008"));
        }

        // ── التوجيه عند فتح التطبيق من إشعار (كان مغلقاً) ──
        handleNotificationIntent(getIntent());
    }

    // ── عند وصول إشعار والتطبيق في الخلفية ──────────────────
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationIntent(intent);
    }

    // ── منطق التوجيه المشترك ─────────────────────────────────
    private void handleNotificationIntent(Intent intent) {
        if (intent == null) return;

        String route = intent.getStringExtra("route");
        if (route == null || route.isEmpty()) return;

        // ✅ نتأكد أن الـ WebView جاهز قبل التوجيه
        final String finalRoute = route;
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() ->
                getBridge().getWebView().loadUrl(
                    "https://zawaj-ai.vercel.app" + finalRoute
                )
            );
        }
    }
}