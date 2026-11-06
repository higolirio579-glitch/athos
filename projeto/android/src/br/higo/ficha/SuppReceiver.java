package br.higo.ficha;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/** Lembretes de suplementos: alarme no horário, notificação com botão "Tomei" e reagendamento diário. */
public class SuppReceiver extends BroadcastReceiver {
    static final String ACT_ALARM = "br.higo.ficha.SUPP_ALARM", ACT_TAKEN = "br.higo.ficha.SUPP_TAKEN";

    static SharedPreferences prefs(Context c) { return Notif.prefs(c); }
    static int code(String id, String t) { return 9000 + ((id + "@" + t).hashCode() & 0x7ff); }
    static int notifId(String id) { return 7300 + (id.hashCode() & 0xff); }

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        try {
            if (ACT_ALARM.equals(a)) {
                String id = i.getStringExtra("id");
                if (id != null && !doneToday(c, id) && !MainActivity.visible) notify(c, id);
                scheduleAll(c);
            } else if (ACT_TAKEN.equals(a)) {
                String id = i.getStringExtra("id");
                if (id != null) taken(c, id);
            }
        } catch (Exception e) { }
    }

    static boolean doneToday(Context c, String id) {
        return AthosJob.today().equals(prefs(c).getString("supp_done_" + id, ""));
    }

    static JSONObject find(Context c, String id) throws Exception {
        JSONArray L = new JSONArray(prefs(c).getString("supps", "[]"));
        for (int k = 0; k < L.length(); k++) { JSONObject s = L.getJSONObject(k); if (id.equals(s.optString("id"))) return s; }
        return null;
    }

    static void taken(Context c, String id) throws Exception {
        SharedPreferences p = prefs(c);
        JSONArray pend = new JSONArray(p.getString("supp_pending", "[]"));
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("ts", System.currentTimeMillis());
        pend.put(o);
        p.edit().putString("supp_pending", pend.toString()).putString("supp_done_" + id, AthosJob.today()).apply();
        ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(notifId(id));
    }

    @SuppressWarnings("deprecation")
    static void notify(Context c, String id) throws Exception {
        if (!Notif.allowed(c)) return;
        JSONObject s = find(c, id);
        if (s == null) return;
        Notif.channels(c);
        String name = s.optString("name", "suplemento"), dose = s.optString("dose", "");
        int nid = notifId(id);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        open.putExtra("open", "dieta");
        PendingIntent po = PendingIntent.getActivity(c, nid, open, fl);
        Intent tk = new Intent(c, SuppReceiver.class);
        tk.setAction(ACT_TAKEN);
        tk.putExtra("id", id);
        PendingIntent pt = PendingIntent.getBroadcast(c, nid + 5000, tk, fl);
        String text = dose.isEmpty() ? "Toque em Tomei quando tomar." : dose + " · toque em Tomei quando tomar.";
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, Notif.CH_REM) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat).setContentTitle("Hora de tomar: " + name).setContentText(text)
         .setAutoCancel(true).setContentIntent(po).setColor(0xFFE9B640).setShowWhen(true)
         .addAction(new Notification.Action.Builder(0, "Tomei", pt).build());
        if (Build.VERSION.SDK_INT < 26) b.setDefaults(Notification.DEFAULT_SOUND);
        if (Build.VERSION.SDK_INT >= 21) b.setCategory(Notification.CATEGORY_REMINDER);
        ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(nid, b.build());
    }

    /** Cancela os alarmes antigos e arma o próximo horário de cada suplemento. */
    static void scheduleAll(Context c) {
        try {
            SharedPreferences p = prefs(c);
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            JSONArray old = new JSONArray(p.getString("supp_codes", "[]"));
            for (int k = 0; k < old.length(); k++) {
                Intent x = new Intent(c, SuppReceiver.class);
                x.setAction(ACT_ALARM);
                am.cancel(PendingIntent.getBroadcast(c, old.getInt(k), x, fl));
            }
            JSONArray codes = new JSONArray();
            JSONArray L = new JSONArray(p.getString("supps", "[]"));
            for (int k = 0; k < L.length(); k++) {
                JSONObject s = L.getJSONObject(k);
                if (!s.optBoolean("remind", true)) continue;
                String id = s.optString("id");
                JSONArray times = s.optJSONArray("times");
                if (times == null) continue;
                for (int j = 0; j < times.length(); j++) {
                    String t = times.optString(j);
                    int m = AthosJob.mins(t, -1);
                    if (m < 0) continue;
                    Calendar cal = Calendar.getInstance();
                    cal.set(Calendar.HOUR_OF_DAY, m / 60);
                    cal.set(Calendar.MINUTE, m % 60);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    if (cal.getTimeInMillis() <= System.currentTimeMillis() + 30000) cal.add(Calendar.DAY_OF_YEAR, 1);
                    int rc = code(id, t);
                    Intent x = new Intent(c, SuppReceiver.class);
                    x.setAction(ACT_ALARM);
                    x.putExtra("id", id);
                    PendingIntent pi = PendingIntent.getBroadcast(c, rc, x, fl);
                    long when = cal.getTimeInMillis();
                    if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
                    else if (Build.VERSION.SDK_INT >= 23) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
                    else am.setExact(AlarmManager.RTC_WAKEUP, when, pi);
                    codes.put(rc);
                }
            }
            p.edit().putString("supp_codes", codes.toString()).apply();
        } catch (Exception e) { }
    }
}
