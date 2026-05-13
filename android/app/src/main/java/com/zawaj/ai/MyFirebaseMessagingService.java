package com.zawaj.ai;

import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import android.media.AudioAttributes;
import android.net.Uri;
import java.io.InputStream;
import java.net.URL;

public class MyFirebaseMessagingService
extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage message) {

        try {

            String type =
                message.getData().get("type");

            String title =
                message.getData().get("title");

            String body =
                message.getData().get("body");

            String avatar =
                message.getData().get("avatar");

            String route =
                message.getData().get("route");

            Bitmap avatarBitmap = null;

            try {
                InputStream input =
                    new URL(avatar).openStream();

                avatarBitmap =
                    BitmapFactory.decodeStream(input);

            } catch (Exception ignored) {}

            Intent intent =
                new Intent(this, MainActivity.class);

            intent.putExtra(
                "route",
                route
            );

            intent.addFlags(
                Intent.FLAG_ACTIVITY_CLEAR_TOP
            );

            PendingIntent pendingIntent =
                PendingIntent.getActivity(
                    this,
                    0,
                    intent,
                    PendingIntent.FLAG_IMMUTABLE
                );

            /*
             * Person
             */

            Person person =
                new Person.Builder()
                    .setName(title)
                    .setIcon(
                        avatarBitmap != null
                            ? androidx.core.graphics.drawable.IconCompat.createWithBitmap(
                                avatarBitmap
                              )
                            : null
                    )
                    .build();

            /*
             * MessagingStyle
             */

            NotificationCompat.MessagingStyle
                messagingStyle =
                    new NotificationCompat
                        .MessagingStyle(person)
                        .addMessage(
                            body,
                            System.currentTimeMillis(),
                            person
                        );

            // ✅ الصوت المخصص
            Uri soundUri = Uri.parse(
                "android.resource://" + getPackageName() + "/raw/notification_sound"
            );

            String channelId =
                type != null && type.equals("message")
                    ? "messages"
                    : "social";

            // إنشاء القناة مع الصوت المخصص (مرة واحدة — Android 8+)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                android.app.NotificationChannel channel =
                    ((android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE))
                        .getNotificationChannel(channelId);

                if (channel == null) {
                    android.app.NotificationChannel newChannel =
                        new android.app.NotificationChannel(
                            channelId,
                            channelId.equals("messages") ? "الرسائل" : "التفاعل",
                            android.app.NotificationManager.IMPORTANCE_HIGH
                        );
                    newChannel.setSound(
                        soundUri,
                        new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    );
                    newChannel.enableVibration(true);
                    ((android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE))
                        .createNotificationChannel(newChannel);
                }
            }

            NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, channelId)

                .setSmallIcon(
                    R.drawable.ic_notification
                )

                .setContentTitle(title)

                .setContentText(body)

                .setPriority(
                    NotificationCompat.PRIORITY_MAX
                )

                .setSound(soundUri)

                .setAutoCancel(true)

                .setContentIntent(
                    pendingIntent
                )

                .setStyle(
                    messagingStyle
                );

            /*
             * Rounded avatar
             */

            if (avatarBitmap != null) {
                builder.setLargeIcon(
                    avatarBitmap
                );
            }

            NotificationManagerCompat
                .from(this)
                .notify(
                    (int) System.currentTimeMillis(),
                    builder.build()
                );

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}