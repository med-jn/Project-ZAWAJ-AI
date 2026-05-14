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

/**
 * ZAWAJ AI — Premium Firebase Messaging Service
 *
 * ✔ MessagingStyle (مثل WhatsApp)
 * ✔ Rounded Avatar
 * ✔ Deep Linking عبر route
 * ✔ قنوات متعددة مع صوت مخصص
 * ✔ تعطيل الصوت إذا طلب المستخدم silent
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    // أسماء القنوات — يجب أن تطابق TYPE_TO_ANDROID_CHANNEL في index.ts
    private static final String CH_MESSAGES     = "messages";
    private static final String CH_SOCIAL       = "social";
    private static final String CH_SUBSCRIPTION = "subscription";
    private static final String CH_SYSTEM       = "system";

    @Override
    public void onCreate() {
        super.onCreate();
        createAllChannels();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        try {
            Map<String, String> data = message.getData();
            if (data.isEmpty()) return;

            String type    = getOrDefault(data, "type",    "system");
            String title   = getOrDefault(data, "title",   "ZAWAJ AI");
            String body    = getOrDefault(data, "body",    "");
            String avatar  = getOrDefault(data, "avatar",  "");
            String route   = getOrDefault(data, "route",   "/notifications");
            boolean silent = "true".equals(data.get("is_silent"));

            // تحميل الأفاتار
            Bitmap avatarBitmap = loadBitmap(avatar);

            // إنشاء PendingIntent للـ Deep Link
            PendingIntent pendingIntent = buildPendingIntent(route);

            // اختيار القناة
            String channelId = resolveChannel(type);

            // Person للـ MessagingStyle
            Person.Builder personBuilder = new Person.Builder().setName(title);
            if (avatarBitmap != null) {
                personBuilder.setIcon(IconCompat.createWithBitmap(avatarBitmap));
            }
            Person person = personBuilder.build();

            // MessagingStyle — مثل WhatsApp
            NotificationCompat.MessagingStyle messagingStyle =
                new NotificationCompat.MessagingStyle(person)
                    .addMessage(body, System.currentTimeMillis(), person);

            // بناء الإشعار
            NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, channelId)
                    .setSmallIcon(R.drawable.ic_notification)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(messagingStyle)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setColor(0xFFB3334B);

            // الأفاتار كـ Large Icon
            if (avatarBitmap != null) {
                builder.setLargeIcon(avatarBitmap);
            }

            // صامت إذا طلب المستخدم
            if (silent) {
                builder.setSilent(true);
            } else {
                Uri soundUri = getSoundUri();
                builder.setSound(soundUri);
            }

            NotificationManagerCompat
                .from(this)
                .notify((int) System.currentTimeMillis(), builder.build());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ── إنشاء كل القنوات فور بدء الـ Service ─────────────────
    private void createAllChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        Uri    soundUri   = getSoundUri();
        AudioAttributes audioAttr = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        // قناة الرسائل — أعلى أولوية
        createChannel(manager, CH_MESSAGES,
            "الرسائل", "رسائل المحادثات",
            NotificationManager.IMPORTANCE_HIGH,
            soundUri, audioAttr);

        // قناة التفاعل الاجتماعي
        createChannel(manager, CH_SOCIAL,
            "التفاعل", "إعجابات وزيارات وتوافقات",
            NotificationManager.IMPORTANCE_DEFAULT,
            soundUri, audioAttr);

        // قناة الاشتراكات
        createChannel(manager, CH_SUBSCRIPTION,
            "الاشتراكات", "إشعارات اشتراك الوسطاء",
            NotificationManager.IMPORTANCE_DEFAULT,
            soundUri, audioAttr);

        // قناة النظام
        createChannel(manager, CH_SYSTEM,
            "النظام", "إشعارات النظام العامة",
            NotificationManager.IMPORTANCE_LOW,
            null, null);
    }

    private void createChannel(
        NotificationManager manager,
        String id, String name, String desc,
        int importance,
        Uri sound, AudioAttributes audioAttr
    ) {
        if (manager.getNotificationChannel(id) != null) return;

        NotificationChannel channel =
            new NotificationChannel(id, name, importance);
        channel.setDescription(desc);
        channel.enableVibration(true);

        if (sound != null && audioAttr != null) {
            channel.setSound(sound, audioAttr);
        }

        manager.createNotificationChannel(channel);
    }

    // ── PendingIntent يفتح MainActivity مع route ─────────────
    private PendingIntent buildPendingIntent(String route) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("route", route);

        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;

        return PendingIntent.getActivity(this, 0, intent, flags);
    }

    // ── تحميل الأفاتار من URL ─────────────────────────────────
    private Bitmap loadBitmap(String url) {
        if (url == null || url.isEmpty()) return null;
        try {
            InputStream input = new URL(url).openStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            return null;
        }
    }

    // ── تحديد القناة حسب النوع ───────────────────────────────
    private String resolveChannel(String type) {
        switch (type) {
            case "message":
            case "mediator":
                return CH_MESSAGES;
            case "like":
            case "view":
            case "match":
            case "contact_request":
                return CH_SOCIAL;
            case "subscription":
                return CH_SUBSCRIPTION;
            default:
                return CH_SYSTEM;
        }
    }

    // ── مسار الصوت المخصص ────────────────────────────────────
    private Uri getSoundUri() {
        return Uri.parse(
            "android.resource://" + getPackageName() + "/raw/notification_sound"
        );
    }

    // ── مساعد آمن لقراءة Map ─────────────────────────────────
    private String getOrDefault(Map<String, String> map, String key, String def) {
        String val = map.get(key);
        return (val != null && !val.isEmpty()) ? val : def;
    }
}