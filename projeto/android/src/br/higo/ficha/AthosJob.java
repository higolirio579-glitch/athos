package br.higo.ficha;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.SharedPreferences;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Roda a cada ~15 min: lembretes do dia e busca de notificações da rede social. */
public class AthosJob extends JobService {
    @Override
    public boolean onStartJob(final JobParameters params) {
        new Thread(new Runnable() {
            public void run() {
                try { reminders(AthosJob.this); } catch (Exception e) { }
                try { social(AthosJob.this); } catch (Exception e) { }
                jobFinished(params, false);
            }
        }).start();
        return true;
    }

    @Override public boolean onStopJob(JobParameters params) { return true; }

    static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }

    static boolean once(SharedPreferences p, String k) {
        String d = today();
        if (d.equals(p.getString("fired_" + k, ""))) return false;
        p.edit().putString("fired_" + k, d).apply();
        return true;
    }

    static int mins(String hhmm, int def) {
        try { String[] a = hhmm.split(":"); return Integer.parseInt(a[0]) * 60 + Integer.parseInt(a[1]); } catch (Exception e) { return def; }
    }

    static void reminders(Context c) throws Exception {
        if (MainActivity.visible) return;
        SharedPreferences p = Notif.prefs(c);
        String raw = p.getString("state", null);
        if (raw == null) return;
        JSONObject s = new JSONObject(raw);
        JSONObject pr = s.optJSONObject("prefs");
        if (pr == null) pr = new JSONObject();
        boolean isToday = today().equals(s.optString("date"));
        double water = isToday ? s.optDouble("water", 0) : 0, goal = s.optDouble("waterGoal", 2500);
        int meals = isToday ? s.optInt("meals", 0) : 0;
        boolean trained = isToday && s.optBoolean("trained", false);
        boolean dayOn = isToday && s.optBoolean("dayOn", false);
        int streak = s.optInt("streak", 0);
        if (!isToday && !s.optBoolean("dayOn", false)) streak = 0;
        Calendar cal = Calendar.getInstance();
        int now = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);

        if (pr.optBoolean("water", true) && now >= 9 * 60 && now <= 21 * 60 && water < goal) {
            long last = p.getLong("water_last", 0);
            if (System.currentTimeMillis() - last > 150 * 60 * 1000L) {
                p.edit().putLong("water_last", System.currentTimeMillis()).apply();
                String tomou = String.format(Locale.forLanguageTag("pt-BR"), "%.1f", water / 1000).replace('.', ',');
                String meta = String.format(Locale.forLanguageTag("pt-BR"), "%.1f", goal / 1000).replace('.', ',');
                Notif.post(c, 7101, Notif.CH_REM, "Hora de beber água", "Você tomou " + tomou + " de " + meta + " L hoje.", "hoje");
            }
        }
        if (pr.optBoolean("meals", true)) {
            if (now >= 12 * 60 + 30 && now <= 15 * 60 && meals == 0 && once(p, "lunch"))
                Notif.post(c, 7102, Notif.CH_REM, "Registrou o almoço?", "Anote o que comeu para acompanhar calorias e macros.", "dieta");
            if (now >= 20 * 60 && now <= 22 * 60 && meals < 2 && once(p, "dinner"))
                Notif.post(c, 7102, Notif.CH_REM, "Registre o jantar", "Faltam refeições no seu dia. Leva 1 minuto.", "dieta");
        }
        if (pr.optBoolean("train", true)) {
            int t = mins(pr.optString("trainTime", "18:00"), 18 * 60);
            String days = pr.optString("trainDays", "1234567");
            int dow = cal.get(Calendar.DAY_OF_WEEK); // 1=domingo
            int iso = dow == Calendar.SUNDAY ? 7 : dow - 1;
            if (days.indexOf((char) ('0' + iso)) >= 0 && now >= t && now <= t + 120 && !trained && once(p, "train"))
                Notif.post(c, 7103, Notif.CH_REM, "Hora do treino", "Seu treino de hoje está esperando. Bora?", "treino");
        }
        if (pr.optBoolean("streak", true) && streak > 0 && !dayOn && now >= 21 * 60 && now <= 23 * 60 + 30 && once(p, "streak"))
            Notif.post(c, 7104, Notif.CH_REM, "Não perca sua sequência", "Sua sequência de " + streak + (streak == 1 ? " dia" : " dias") + " acaba hoje. Registre um treino ou refeição.", "hoje");
    }

    static void social(Context c) throws Exception {
        SharedPreferences p = Notif.prefs(c);
        String key = p.getString("dev_key", null);
        if (key == null || !p.getBoolean("soc_on", false) || MainActivity.visible) return;
        long after = p.getLong("soc_after", 0);
        HttpURLConnection h = (HttpURLConnection) new URL(Notif.SUPA + "/rest/v1/rpc/notif_poll").openConnection();
        h.setConnectTimeout(15000);
        h.setReadTimeout(20000);
        h.setRequestMethod("POST");
        h.setDoOutput(true);
        h.setRequestProperty("apikey", Notif.ANON);
        h.setRequestProperty("Content-Type", "application/json");
        JSONObject body = new JSONObject();
        body.put("p_key", key);
        body.put("p_after", after);
        OutputStream os = h.getOutputStream();
        os.write(body.toString().getBytes("UTF-8"));
        os.close();
        if (h.getResponseCode() != 200) return;
        InputStream in = h.getInputStream();
        JSONArray a = new JSONArray(MainActivity.readAll(in));
        if (a.length() == 0) return;
        long max = after;
        int likes = 0;
        String lastLiker = null;
        for (int i = 0; i < a.length(); i++) {
            JSONObject n = a.getJSONObject(i);
            long id = n.optLong("id");
            if (id > max) max = id;
            String kind = n.optString("kind"), who = n.optString("actor", "Alguém"), txt = n.isNull("body") ? "" : n.optString("body");
            if ("like".equals(kind)) { likes++; lastLiker = who; }
            else if ("comment".equals(kind)) Notif.post(c, 7200 + (int) (id % 500), Notif.CH_SOC, who + " comentou", txt, "social");
            else if ("pr".equals(kind)) Notif.post(c, 7600 + (int) (id % 100), Notif.CH_SOC, who + " bateu um recorde!", txt.isEmpty() ? "Veja o treino no ATHOS." : txt, "social");
            else if ("follow".equals(kind)) Notif.post(c, 7800 + (int) (id % 100), Notif.CH_SOC, "Novo seguidor", who + " começou a seguir você.", "social");
            else if ("message".equals(kind)) {
                String conv = n.optString("conversation_id", "");
                Notif.post(c, 8000 + (conv.hashCode() & 0x3ff), Notif.CH_SOC, who, txt, "chat:" + conv);
            }
        }
        if (likes == 1) Notif.post(c, 7900, Notif.CH_SOC, "Nova curtida", lastLiker + " curtiu seu post.", "social");
        else if (likes > 1) Notif.post(c, 7900, Notif.CH_SOC, likes + " novas curtidas", lastLiker + " e outras pessoas curtiram seus posts.", "social");
        p.edit().putLong("soc_after", max).apply();
    }
}
