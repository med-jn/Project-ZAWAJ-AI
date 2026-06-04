package com.zawaj.ai;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.InputStream;
import java.net.URL;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CH_MESSAGES     = "messages";
    private static final String CH_SOCIAL       = "social";
    private static final String CH_SUBSCRIPTION = "subscription";
    private static final String CH_SYSTEM       = "system";

    private static final AtomicInteger notifId = new AtomicInteger(1000);

    // ✅ Thread pool لتحميل الأفاتار خارج Main Thread
    private static final ExecutorService executor = Executors.newCachedThreadPool();

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        createAllChannels();
        // ✅ عند تجديد الـ token — لا نفعل شيئاً هنا
        // usePushNotifications.ts سيحفظه عند أول register()
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        createAllChannels();

        Map<String, String> data = message.getData();

        final String type   = getOrDef(data, "type",      "system");
        final String title  = getOrDef(data, "title",     "ZAWAJ AI");
        final String body   = getOrDef(data, "body",      "إشعار جديد");
        final String avatar = getOrDef(data, "avatar",    "");
        final String route  = getOrDef(data, "route",     "/notifications");
        final String chanId = getOrDef(data, "channel_id", resolveChannel(type));
        final boolean silent = "true".equals(data.get("is_silent"));

        // ✅ تحميل الأفاتار في background thread — لا يبطئ الإشعار
        executor.execute(() -> {
            Bitmap avatarBitmap = loadBitmap(avatar);
            showNotification(title, body, route, chanId, silent, avatarBitmap);
        });
    }

    private void showNotification(String title, String body, String route,
                                   String chanId, boolean silent, Bitmap avatarBitmap) {

        // ✅ RTL: نضيف RTL mark في بداية العنوان والنص
        // \u202B = RIGHT-TO-LEFT EMBEDDING
        String rtlTitle = "\u202B" + title;
        String rtlBody  = "\u202B" + body;

        PendingIntent pendingIntent = buildPendingIntent(route);

        Person.Builder personBuilder = new Person.Builder().setName(rtlTitle);
        if (avatarBitmap != null) {
            personBuilder.setIcon(IconCompat.createWithBitmap(getRoundedBitmap(avatarBitmap)));
        }
        Person person = personBuilder.build();

        NotificationCompat.MessagingStyle style =
            new NotificationCompat.MessagingStyle(person)
                .setConversationTitle(rtlTitle)
                .addMessage(rtlBody, System.currentTimeMillis(), person);

        NotificationCompat.Builder builder =
            new NotificationCompat.Builder(this, chanId)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(rtlTitle)
                .setContentText(rtlBody)
                .setStyle(style)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setColor(0xFFB3334B);

        if (avatarBitmap != null) {
            builder.setLargeIcon(getRoundedBitmap(avatarBitmap));
        }

        if (silent) builder.setSilent(true);
        else        builder.setSound(getSoundUri());

        int id = notifId.getAndIncrement();
        try {
            NotificationManagerCompat.from(this).notify(id, builder.build());
        } catch (SecurityException e) {
            e.printStackTrace();
        }
    }

    // ── PendingIntent ─────────────────────────────────────────
    // ✅ route يُوضع في Extra فقط — بسيط وموثوق
    // MainActivity يقرأه مباشرة بدون URI parsing
    private PendingIntent buildPendingIntent(String route) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        // ✅ نستخدم Extra فقط — بدون setData() الذي يمسح الـ Extras
        intent.putExtra("route", route);

        // request code فريد لكل إشعار — يمنع استبدال PendingIntent
        int reqCode = notifId.getAndIncrement();

        // ✅ FLAG_MUTABLE مطلوب مع Android 12+ لأن Capacitor يحتاج تعديل الـ Intent
        int flags;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE;
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        } else {
            flags = PendingIntent.FLAG_UPDATE_CURRENT;
        }

        return PendingIntent.getActivity(this, reqCode, intent, flags);
    }

    private void createAllChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager mgr = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (mgr == null) return;

        Uri soundUri   = getSoundUri();
        AudioAttributes audioAttr = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        makeChannel(mgr, CH_MESSAGES,     "الرسائل",    "رسائل المحادثات",          NotificationManager.IMPORTANCE_HIGH,    soundUri, audioAttr);
        makeChannel(mgr, CH_SOCIAL,       "التفاعل",    "إعجابات وزيارات وتوافقات", NotificationManager.IMPORTANCE_HIGH,    soundUri, audioAttr);
        makeChannel(mgr, CH_SUBSCRIPTION, "الاشتراكات", "إشعارات الوسطاء",          NotificationManager.IMPORTANCE_DEFAULT, soundUri, audioAttr);
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

    private Bitmap loadBitmap(String url) {
        if (url == null || url.isEmpty()) return null;
        try {
            InputStream in = new URL(url).openStream();
            return BitmapFactory.decodeStream(in);
        } catch (Exception e) { return null; }
    }

    private Bitmap getRoundedBitmap(Bitmap src) {
        if (src == null) return null;
        int size = Math.min(src.getWidth(), src.getHeight());
        Bitmap out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        android.graphics.Canvas canvas = new android.graphics.Canvas(out);
        android.graphics.Paint paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint);
        paint.setXfermode(new android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(src, 0, 0, paint);
        return out;
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
