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
 * الحل النهائي: نحوّل route من FCM إلى deep link حقيقي
 * zawaj://app/chat/?id=X
 *
 * Capacitor App Plugin يقرأه في JS عبر:
 *   - getLaunchUrl()  → Cold Start
 *   - appUrlOpen      → Warm Start
 *
 * لا SharedPreferences، لا loadUrl، لا Preferences plugin.
 */
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

        // حوّل route من FCM إلى deep link في الـ Intent
        rewriteIntentToDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        rewriteIntentToDeepLink(intent);
        setIntent(intent);
    }

    /**
     * إذا كان الـ Intent قادماً من FCM ويحمل "route" extra،
     * نحوّله إلى deep link zawaj://app{route}
     * حتى يقرأه Capacitor App Plugin كـ appUrlOpen / getLaunchUrl
     */
    private void rewriteIntentToDeepLink(Intent intent) {
        if (intent == null) return;

        // تجاهل إذا كان deep link موجوداً أصلاً
        if (intent.getData() != null) return;

        String route = intent.getStringExtra("route");
        if (route == null || route.isEmpty()) return;

        // تطبيع الـ route
        if (!route.startsWith("/")) route = "/" + route;
        if (route.contains("?") && !route.contains("/?")) {
            route = route.replace("?", "/?");
        }

        // بناء deep link: zawaj://app/chat/?id=X
        String deepLink = "zawaj://app" + route;

        try {
            intent.setData(Uri.parse(deepLink));
        } catch (Exception e) {
            // إذا فشل، تجاهل
        }
    }
}