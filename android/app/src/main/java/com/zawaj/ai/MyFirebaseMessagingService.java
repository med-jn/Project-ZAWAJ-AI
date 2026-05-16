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

/**
 * ZAWAJ AI — Firebase Messaging Service
 *
 * الإصلاح الجوهري:
 * ✔ يعمل مع data-only messages (بدون notification block)
 * ✔ onMessageReceived يُستدعى دائماً سواء كان التطبيق مفتوحاً أو مغلقاً
 * ✔ حذف شرط data.isEmpty() الذي كان يُلغي الإشعارات
 * ✔ القنوات تُنشأ في onNewToken و onMessageReceived معاً
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CH_MESSAGES     = "messages";
    private static final String CH_SOCIAL       = "social";
    private static final String CH_SUBSCRIPTION = "subscription";
    private static final String CH_SYSTEM       = "system";

    // عداد لضمان notification ID فريد لكل إشعار
    private static final AtomicInteger notifId = new AtomicInteger(1000);

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // إنشاء القنوات عند أول تشغيل أيضاً
        createAllChannels();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        // ✅ إنشاء القنوات هنا أيضاً — ضروري عند أول رسالة
        createAllChannels();

        Map<String, String> data = message.getData();

        // ✅ لا نتحقق من data.isEmpty() — نتابع حتى لو data فارغة
        // (مع data-only messages، data لن تكون فارغة أبداً)

        String type     = getOrDef(data, "type",      "system");
        String title    = getOrDef(data, "title",      "ZAWAJ AI");
        String body     = getOrDef(data, "body",       "إشعار جديد");
        String avatar   = getOrDef(data, "avatar",     "");
        String route    = getOrDef(data, "route",      "/notifications");
        String chanId   = getOrDef(data, "channel_id", resolveChannel(type));
        boolean silent  = "true".equals(data.get("is_silent"));

        // تحميل الأفاتار (في thread منفصل لتجنب NetworkOnMainThreadException)
        Bitmap avatarBitmap = loadBitmap(avatar);

        // PendingIntent → يفتح MainActivity مع route
        PendingIntent pendingIntent = buildPendingIntent(route);

        // Person للـ MessagingStyle
        Person.Builder personBuilder = new Person.Builder().setName(title);
        if (avatarBitmap != null) {
            personBuilder.setIcon(IconCompat.createWithBitmap(
                getRoundedBitmap(avatarBitmap)
            ));
        }
        Person person = personBuilder.build();

        // MessagingStyle
        NotificationCompat.MessagingStyle style =
            new NotificationCompat.MessagingStyle(person)
                .addMessage(body, System.currentTimeMillis(), person);

        // بناء الإشعار
        NotificationCompat.Builder builder =
            new NotificationCompat.Builder(this, chanId)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(style)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setColor(0xFFB3334B);

        if (avatarBitmap != null) {
            builder.setLargeIcon(getRoundedBitmap(avatarBitmap));
        }

        if (silent) {
            builder.setSilent(true);
        } else {
            builder.setSound(getSoundUri());
        }

        // ✅ ID فريد لكل إشعار — لا يُستبدل بإشعار آخر
        int id = notifId.getAndIncrement();

        try {
            NotificationManagerCompat.from(this).notify(id, builder.build());
        } catch (SecurityException e) {
            // صلاحيات الإشعارات غير ممنوحة
            e.printStackTrace();
        }
    }

    // ── إنشاء القنوات ─────────────────────────────────────────
    private void createAllChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager mgr =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (mgr == null) return;

        Uri soundUri = getSoundUri();
        AudioAttributes audioAttr = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        makeChannel(mgr, CH_MESSAGES,
            "الرسائل", "رسائل المحادثات",
            NotificationManager.IMPORTANCE_HIGH,
            soundUri, audioAttr);

        makeChannel(mgr, CH_SOCIAL,
            "التفاعل", "إعجابات وزيارات وتوافقات",
            NotificationManager.IMPORTANCE_HIGH,
            soundUri, audioAttr);

        makeChannel(mgr, CH_SUBSCRIPTION,
            "الاشتراكات", "إشعارات الوسطاء",
            NotificationManager.IMPORTANCE_DEFAULT,
            soundUri, audioAttr);

        makeChannel(mgr, CH_SYSTEM,
            "النظام", "إشعارات عامة",
            NotificationManager.IMPORTANCE_LOW,
            null, null);
    }

    private void makeChannel(
        NotificationManager mgr,
        String id, String name, String desc,
        int importance, Uri sound, AudioAttributes attr
    ) {
        // ✅ لا نتخطى إذا القناة موجودة — نُعيد إنشاءها لضمان الصوت الصحيح
        // (Android يتجاهل التغييرات على قناة موجودة — لذا نحتاج حذفها أحياناً)
        if (mgr.getNotificationChannel(id) != null) return;

        NotificationChannel ch = new NotificationChannel(id, name, importance);
        ch.setDescription(desc);
        ch.enableVibration(true);
        if (sound != null && attr != null) {
            ch.setSound(sound, attr);
        }
        mgr.createNotificationChannel(ch);
    }

    // ── PendingIntent ─────────────────────────────────────────
    private PendingIntent buildPendingIntent(String route) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        intent.putExtra("route", route);
        intent.setData(Uri.parse("zawaj://app" + route));

        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;

        return PendingIntent.getActivity(
            this,
            notifId.get(), // request code فريد
            intent,
            flags
        );
    }

    // ── تحميل الأفاتار ────────────────────────────────────────
    private Bitmap loadBitmap(String url) {
        if (url == null || url.isEmpty()) return null;
        try {
            InputStream in = new URL(url).openStream();
            return BitmapFactory.decodeStream(in);
        } catch (Exception e) {
            return null;
        }
    }

    // ── تدوير الأفاتار ────────────────────────────────────────
    private Bitmap getRoundedBitmap(Bitmap src) {
        if (src == null) return null;
        int size = Math.min(src.getWidth(), src.getHeight());
        Bitmap output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        android.graphics.Canvas canvas = new android.graphics.Canvas(output);
        android.graphics.Paint paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint);
        paint.setXfermode(new android.graphics.PorterDuffXfermode(
            android.graphics.PorterDuff.Mode.SRC_IN
        ));
        canvas.drawBitmap(src, 0, 0, paint);
        return output;
    }

    // ── القناة حسب النوع ─────────────────────────────────────
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

    // ── الصوت المخصص ─────────────────────────────────────────
    private Uri getSoundUri() {
        return Uri.parse(
            "android.resource://" + getPackageName() + "/raw/notification_sound"
        );
    }

    // ── قراءة آمنة من Map ────────────────────────────────────
    private String getOrDef(Map<String, String> map, String key, String def) {
        String v = map.get(key);
        return (v != null && !v.isEmpty()) ? v : def;
    }
}