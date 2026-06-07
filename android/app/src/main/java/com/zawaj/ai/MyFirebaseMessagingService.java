package com.zawaj.ai;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CH_MESSAGES     = "messages";
    private static final String CH_SOCIAL       = "social";
    private static final String CH_SUBSCRIPTION = "subscription";
    private static final String CH_SYSTEM       = "system";

    private static final AtomicInteger notifId = new AtomicInteger(1000);

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        createAllChannels();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        createAllChannels();

        Map<String, String> data = message.getData();

        final String type    = getOrDef(data, "type",       "system");
        final String title   = getOrDef(data, "title",      "ZAWAJ AI");
        final String body    = getOrDef(data, "body",       "إشعار جديد");
        final String route   = getOrDef(data, "route",      "/notifications");
        final String chanId  = getOrDef(data, "channel_id", resolveChannel(type));
        final boolean silent = "true".equals(data.get("is_silent"));

        // ✅ أفاتار محلي فوري — دائرة #b3334b + الحرف الأول
        Bitmap avatar = buildLetterAvatar(title);

        showNotification(title, body, route, chanId, silent, avatar);
    }

    // ── أفاتار نصي محلي — لا network، لا تأخير ──────────────
    private Bitmap buildLetterAvatar(String name) {
        int size = 128;
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);

        // دائرة حمراء
        Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setColor(Color.parseColor("#b3334b"));
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, bgPaint);

        // الحرف الأول
        String letter = "ز";
        if (name != null && !name.isEmpty()) {
            // نأخذ أول حرف حقيقي (نتخطى RTL marks والمسافات)
            for (int i = 0; i < name.length(); i++) {
                char c = name.charAt(i);
                if (Character.isLetter(c)) {
                    letter = String.valueOf(c).toUpperCase();
                    break;
                }
            }
        }

        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(Color.WHITE);
        textPaint.setTextSize(size * 0.45f);
        textPaint.setTypeface(Typeface.DEFAULT_BOLD);
        textPaint.setTextAlign(Paint.Align.CENTER);

        // توسيط الحرف عمودياً
        float y = size / 2f - (textPaint.descent() + textPaint.ascent()) / 2f;
        canvas.drawText(letter, size / 2f, y, textPaint);

        return bmp;
    }

    private void showNotification(String title, String body, String route,
                                   String chanId, boolean silent, Bitmap avatar) {
        PendingIntent pi = buildPendingIntent(route);

        NotificationCompat.BigTextStyle style =
            new NotificationCompat.BigTextStyle()
                .bigText(body)
                .setBigContentTitle(title);

        NotificationCompat.Builder builder =
            new NotificationCompat.Builder(this, chanId)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(style)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setColor(0xFFB3334B)
                .setLargeIcon(avatar);

        if (silent) builder.setSilent(true);
        else        builder.setSound(getSoundUri());

        try {
            NotificationManagerCompat.from(this).notify(notifId.getAndIncrement(), builder.build());
        } catch (SecurityException e) {
            e.printStackTrace();
        }
    }

    private PendingIntent buildPendingIntent(String route) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("route", route);

        int flags;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE;
        } else {
            flags = PendingIntent.FLAG_UPDATE_CURRENT;
        }

        return PendingIntent.getActivity(this, notifId.getAndIncrement(), intent, flags);
    }

    private void createAllChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager mgr = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (mgr == null) return;

        Uri soundUri = getSoundUri();
        AudioAttributes attr = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        makeChannel(mgr, CH_MESSAGES,     "الرسائل",    "رسائل المحادثات",          NotificationManager.IMPORTANCE_HIGH,    soundUri, attr);
        makeChannel(mgr, CH_SOCIAL,       "التفاعل",    "إعجابات وزيارات وتوافقات", NotificationManager.IMPORTANCE_HIGH,    soundUri, attr);
        makeChannel(mgr, CH_SUBSCRIPTION, "الاشتراكات", "إشعارات الوسطاء",          NotificationManager.IMPORTANCE_DEFAULT, soundUri, attr);
        makeChannel(mgr, CH_SYSTEM,       "النظام",     "إشعارات عامة",             NotificationManager.IMPORTANCE_LOW,     null,     null);
    }

    private void makeChannel(NotificationManager mgr, String id, String name, String desc,
                              int importance, Uri sound, AudioAttributes attr) {
        if (mgr.getNotificationChannel(id) != null) return;
        NotificationChannel ch = new NotificationChannel(id, name, importance);
        ch.setDescription(desc);
        ch.enableVibration(true);
        if (sound != null && attr != null) ch.setSound(sound, attr);
        mgr.createNotificationChannel(ch);
    }

    private String resolveChannel(String type) {
        switch (type) {
            case "message": case "mediator":                                  return CH_MESSAGES;
            case "like": case "view": case "match": case "contact_request":   return CH_SOCIAL;
            case "subscription":                                               return CH_SUBSCRIPTION;
            default:                                                           return CH_SYSTEM;
        }
    }

    private Uri getSoundUri() {
        return Uri.parse("android.resource://" + getPackageName() + "/raw/notification_sound");
    }

    private String getOrDef(Map<String, String> map, String key, String def) {
        String v = map.get(key);
        return (v != null && !v.isEmpty()) ? v : def;
    }
}
