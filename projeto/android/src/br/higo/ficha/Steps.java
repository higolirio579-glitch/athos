package br.higo.ficha;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import java.util.Iterator;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

/**
 * Passos do dia: o sensor TYPE_STEP_COUNTER do celular conta sozinho desde que o aparelho ligou.
 * A cada leitura (app aberto ou tarefa a cada ~15 min) somamos a diferença ao dia atual.
 */
public class Steps {
    static boolean allowed(Context c) {
        return Build.VERSION.SDK_INT < 29 || c.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
    }

    static boolean hasSensor(Context c) {
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        return sm != null && sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    /** Lê o contador uma vez (espera no máximo 2 s) e soma ao dia. Não roda na thread principal. */
    static synchronized void sample(Context c) {
        if (!allowed(c)) return;
        final SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) return;
        Sensor s = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (s == null) return;
        final float[] val = {-1};
        final CountDownLatch latch = new CountDownLatch(1);
        HandlerThread ht = new HandlerThread("athos-steps");
        ht.start();
        SensorEventListener l = new SensorEventListener() {
            public void onSensorChanged(SensorEvent e) { if (val[0] < 0) { val[0] = e.values[0]; latch.countDown(); } }
            public void onAccuracyChanged(Sensor x, int a) { }
        };
        try {
            sm.registerListener(l, s, SensorManager.SENSOR_DELAY_NORMAL, new Handler(ht.getLooper()));
            latch.await(2, TimeUnit.SECONDS);
        } catch (Exception e) {
        } finally {
            try { sm.unregisterListener(l); } catch (Exception e) { }
            ht.quitSafely();
        }
        if (val[0] >= 0) add(c, val[0]);
    }

    static void add(Context c, float v) {
        try {
            SharedPreferences p = Notif.prefs(c);
            float last = p.getFloat("st_last", -1);
            JSONObject days = new JSONObject(p.getString("st_days", "{}"));
            String d = AthosJob.today();
            if (last >= 0) {
                float delta = v - last;
                if (delta < 0) delta = v;            // o celular reiniciou e o contador voltou a zero
                if (delta > 0 && delta < 60000) days.put(d, days.optLong(d, 0) + (long) delta);
            } else if (!days.has(d)) {
                days.put(d, 0);
            }
            // guarda só os últimos 60 dias
            if (days.length() > 60) {
                String min = null;
                for (Iterator<String> it = days.keys(); it.hasNext(); ) { String k = it.next(); if (min == null || k.compareTo(min) < 0) min = k; }
                if (min != null) days.remove(min);
            }
            p.edit().putFloat("st_last", v).putString("st_days", days.toString()).apply();
        } catch (Exception e) { }
    }

    static String json(Context c) {
        try {
            JSONObject o = new JSONObject();
            o.put("perm", allowed(c));
            o.put("sensor", hasSensor(c));
            o.put("days", new JSONObject(Notif.prefs(c).getString("st_days", "{}")));
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }
}
