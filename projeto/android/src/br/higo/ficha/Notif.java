package br.higo.ficha;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import java.security.SecureRandom;

/** Canais, envio de notificações e agendamento da verificação periódica. */
public class Notif {
    static final String CH_REM = "lembretes", CH_SOC = "social", CH_REST = "descanso";
    static final int JOB_ID = 4100;
    static final String SUPA = "https://shvphmajljvlnqlhryfw.supabase.co";
    static final String ANON = "sb_publishable_hQy8kXAfgKEUaRpXuGmiUA_UI6O3FBR";

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("athos_notif", Context.MODE_PRIVATE); }

    static void channels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm.getNotificationChannel(CH_REM) == null) {
            NotificationChannel a = new NotificationChannel(CH_REM, "Lembretes", NotificationManager.IMPORTANCE_DEFAULT);
            a.setDescription("Água, refeições, hora do treino e sequência");
            nm.createNotificationChannel(a);
        }
        if (nm.getNotificationChannel(CH_SOC) == null) {
            NotificationChannel b = new NotificationChannel(CH_SOC, "Rede social", NotificationManager.IMPORTANCE_HIGH);
            b.setDescription("Curtidas, comentários, seguidores e mensagens");
            nm.createNotificationChannel(b);
        }
        if (nm.getNotificationChannel(CH_REST) == null) {
            NotificationChannel r = new NotificationChannel(CH_REST, "Descanso entre séries", NotificationManager.IMPORTANCE_HIGH);
            r.setDescription("Aviso quando o descanso termina");
            r.enableVibration(true);
            r.setVibrationPattern(new long[]{0, 300, 150, 300, 150, 300});
            nm.createNotificationChannel(r);
        }
    }

    static boolean allowed(Context c) {
        if (Build.VERSION.SDK_INT >= 33 && c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        return Build.VERSION.SDK_INT < 24 || nm.areNotificationsEnabled();
    }

    @SuppressWarnings("deprecation")
    static void post(Context c, int id, String ch, String title, String text, String open) {
        if (!allowed(c)) return;
        channels(c);
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (open != null) i.putExtra("open", open);
        PendingIntent pi = PendingIntent.getActivity(c, id, i, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, ch) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat).setContentTitle(title).setContentText(text)
         .setStyle(new Notification.BigTextStyle().bigText(text))
         .setAutoCancel(true).setContentIntent(pi).setColor(0xFFE9B640).setShowWhen(true);
        if (Build.VERSION.SDK_INT < 26) {
            if (CH_REST.equals(ch)) b.setVibrate(new long[]{0, 300, 150, 300, 150, 300}).setPriority(Notification.PRIORITY_HIGH);
            else if (CH_SOC.equals(ch)) b.setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
            else b.setDefaults(Notification.DEFAULT_SOUND);
        }
        if (Build.VERSION.SDK_INT >= 21) b.setCategory(CH_SOC.equals(ch) ? Notification.CATEGORY_SOCIAL : CH_REST.equals(ch) ? Notification.CATEGORY_ALARM : Notification.CATEGORY_REMINDER);
        ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(id, b.build());
    }

    static void cancel(Context c, int id) {
        ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(id);
    }

    static void schedule(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null) return;
        for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == JOB_ID) return;
        JobInfo.Builder b = new JobInfo.Builder(JOB_ID, new ComponentName(c, AthosJob.class))
            .setPeriodic(15 * 60 * 1000L).setPersisted(true);
        try { js.schedule(b.build()); } catch (Exception e) { }
    }

    static String key(Context c) {
        SharedPreferences p = prefs(c);
        String k = p.getString("dev_key", null);
        if (k == null) {
            byte[] r = new byte[32];
            new SecureRandom().nextBytes(r);
            StringBuilder sb = new StringBuilder();
            for (byte x : r) sb.append(String.format("%02x", x & 0xff));
            k = sb.toString();
            p.edit().putString("dev_key", k).putLong("soc_after", 0).apply();
        }
        return k;
    }
}
