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

    // نحفظ الـ route هنا إذا وصل قبل جاهزية الـ WebView
    private String pendingRoute = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setNavigationBarColor(Color.parseColor("#080008"));
        }

        // استخراج الـ route وحفظه — سيُنفَّذ عند جاهزية الـ WebView
        pendingRoute = extractRoute(getIntent());
    }

    @Override
    public void onStart() {
        super.onStart();
        // WebView جاهز بعد onStart — ننفّذ الـ route المعلّق
        if (pendingRoute != null) {
            navigateTo(pendingRoute);
            pendingRoute = null;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String route = extractRoute(intent);
        if (route != null) {
            // التطبيق مفتوح بالفعل — WebView جاهز
            navigateTo(route);
        }
    }

    private void navigateTo(final String route) {
        final String targetUrl = BASE_URL + route;

        // نحاول مباشرة أولاً
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() ->
                getBridge().getWebView().loadUrl(targetUrl)
            );
            return;
        }

        // إذا لم يكن جاهزاً نحاول كل 200ms حتى 3 ثوانٍ
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

        // Extra مباشر من FCM
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