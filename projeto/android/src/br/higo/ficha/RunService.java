package br.higo.ficha;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Locale;

/** Grava corrida/caminhada/pedal: GPS, passos (sensor), parciais por km e voz. */
public class RunService extends Service implements LocationListener, SensorEventListener, TextToSpeech.OnInitListener {
    static volatile RunService inst;
    static volatile boolean starting;
    static volatile String startingType = "run";
    static final String CH = "atividade";
    static final int NID = 7;
    static final Locale BR = new Locale("pt", "BR");

    String type = "run";
    boolean voice = true, paused = false, autoP = false, hasFix = false, hasSteps = false, ttsOk = false;
    long start, lastFixT, lastMoveMs, lastNotif, lastSave;
    double elapsed, moving, dist, elev, speed, altRef;
    Double altSm = null;
    float acc = 999;
    Location last;
    int rej = 0, steps = 0, nextKm = 1;
    float prevRaw = -1;
    final ArrayDeque<long[]> cadQ = new ArrayDeque<long[]>();
    final ArrayList<double[]> pts = new ArrayList<double[]>();
    final ArrayList<double[]> splits = new ArrayList<double[]>();
    Handler h;
    LocationManager lm;
    SensorManager sm;
    TextToSpeech tts;
    NotificationManager nm;

    static File activeFile(android.content.Context c) { return new File(c.getFilesDir(), "run_active.json"); }

    double thr() { return "bike".equals(type) ? 1.5 : 0.6; }
    double vmax() { return "bike".equals(type) ? 25 : ("walk".equals(type) ? 4 : 9); }
    String label() { return "bike".equals(type) ? "Pedal" : ("walk".equals(type) ? "Caminhada" : "Corrida"); }

    @Override
    public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent i, int flags, int id) {
        if (inst != null) return START_NOT_STICKY;
        try {
            if (i != null && i.getStringExtra("type") != null) type = i.getStringExtra("type");
            voice = i == null || i.getBooleanExtra("voice", true);
            start = System.currentTimeMillis();
            h = new Handler(Looper.getMainLooper());
            nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (Build.VERSION.SDK_INT >= 26) {
                NotificationChannel c = new NotificationChannel(CH, "Atividade em andamento", NotificationManager.IMPORTANCE_LOW);
                c.setShowBadge(false);
                nm.createNotificationChannel(c);
            }
            Notification n = notif();
            if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            else startForeground(NID, n);
            inst = this;
            starting = false;
            lm = (LocationManager) getSystemService(LOCATION_SERVICE);
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0, this, Looper.getMainLooper());
            if (!"bike".equals(type) && (Build.VERSION.SDK_INT < 29 || checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED)) {
                sm = (SensorManager) getSystemService(SENSOR_SERVICE);
                Sensor sc = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
                if (sc != null) hasSteps = sm.registerListener(this, sc, SensorManager.SENSOR_DELAY_NORMAL);
            }
            if (voice) tts = new TextToSpeech(this, this);
            h.postDelayed(tick, 1000);
        } catch (Exception e) {
            starting = false;
            inst = null;
            cleanup();
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    final Runnable tick = new Runnable() {
        public void run() {
            synchronized (RunService.this) {
                long now = System.currentTimeMillis();
                if (!paused) {
                    elapsed += 1;
                    autoP = !hasFix || (now - lastMoveMs > 6000);
                    if (!autoP) moving += 1;
                }
                if (now - lastFixT > 8000) speed = 0;
                if (now - lastNotif > 5000) { try { nm.notify(NID, notif()); } catch (Exception e) { } lastNotif = now; }
                if (now - lastSave > 15000) { save(full()); lastSave = now; }
            }
            if (h != null) h.postDelayed(this, 1000);
        }
    };

    @Override
    public synchronized void onLocationChanged(Location l) {
        long now = System.currentTimeMillis();
        acc = l.hasAccuracy() ? l.getAccuracy() : 50;
        lastFixT = now;
        hasFix = true;
        if (l.hasAltitude() && acc <= 30) {
            double a = l.getAltitude();
            if (altSm == null) { altSm = a; altRef = a; }
            else {
                altSm = altSm * 0.8 + a * 0.2;
                if (paused) altRef = altSm;
                else if (altSm - altRef > 3) { elev += altSm - altRef; altRef = altSm; }
                else if (altRef - altSm > 3) altRef = altSm;
            }
        }
        if (acc > 30) return;
        if (last == null) { last = l; if (!paused) addPt(l); return; }
        double d = last.distanceTo(l);
        double dt = Math.max(0.5, (l.getTime() - last.getTime()) / 1000.0);
        if (d / dt > vmax() * 1.6 && d > 30) { if (++rej < 3) return; }
        rej = 0;
        double sp = l.hasSpeed() ? l.getSpeed() : d / dt;
        speed = sp;
        if (sp >= thr()) lastMoveMs = now;
        if (paused) { last = l; return; }
        if (d < Math.max(3, acc * 0.5)) return;
        dist += d;
        last = l;
        addPt(l);
        while (dist >= nextKm * 1000.0) {
            double prevT = splits.isEmpty() ? 0 : splits.get(splits.size() - 1)[1];
            splits.add(new double[]{nextKm, moving, steps, elev});
            announce(nextKm, moving - prevT);
            nextKm++;
        }
    }

    void addPt(Location l) {
        pts.add(new double[]{l.getLatitude(), l.getLongitude(), l.hasAltitude() ? l.getAltitude() : 0, moving, dist});
    }

    @Override public void onStatusChanged(String p, int s, Bundle b) { }
    @Override public void onProviderEnabled(String p) { }
    @Override public void onProviderDisabled(String p) { }

    @Override
    public synchronized void onSensorChanged(SensorEvent e) {
        float raw = e.values[0];
        if (prevRaw >= 0 && !paused) {
            int d = (int) (raw - prevRaw);
            if (d > 0 && d < 2000) steps += d;
        }
        prevRaw = raw;
        long now = System.currentTimeMillis();
        cadQ.addLast(new long[]{now, steps});
        while (cadQ.size() > 1 && now - cadQ.peekFirst()[0] > 30000) cadQ.pollFirst();
    }

    @Override public void onAccuracyChanged(Sensor s, int a) { }

    int cad() {
        if (cadQ.size() < 2 || paused) return 0;
        long[] a = cadQ.peekFirst(), b = cadQ.peekLast();
        long span = b[0] - a[0];
        if (span < 8000 || System.currentTimeMillis() - b[0] > 15000) return 0;
        return (int) Math.round((b[1] - a[1]) * 60000.0 / span);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS && tts != null) {
            int r = tts.setLanguage(BR);
            ttsOk = r >= 0;
        }
    }

    static String spoken(double sec) {
        int s = (int) Math.round(sec);
        int hh = s / 3600, mm = (s % 3600) / 60, ss = s % 60;
        StringBuilder b = new StringBuilder();
        if (hh > 0) b.append(hh).append(hh == 1 ? " hora " : " horas ");
        if (mm > 0 || hh > 0) b.append(mm).append(mm == 1 ? " minuto" : " minutos");
        if (hh == 0) {
            if (mm > 0) b.append(" e ");
            b.append(ss).append(ss == 1 ? " segundo" : " segundos");
        }
        return b.toString().trim();
    }

    void announce(int km, double splitT) {
        if (!voice || !ttsOk || tts == null) return;
        String txt;
        if ("bike".equals(type)) {
            if (km % 5 != 0) return;
            txt = km + " quilômetros. Tempo " + spoken(moving) + ". Velocidade média " + Math.round(dist / Math.max(1, moving) * 3.6) + " quilômetros por hora.";
        } else {
            txt = km + (km == 1 ? " quilômetro" : " quilômetros") + ". Tempo " + spoken(moving) + ". Último quilômetro em " + spoken(splitT) + ".";
        }
        try { tts.speak(txt, TextToSpeech.QUEUE_ADD, null, "km" + km); } catch (Exception e) { }
    }

    Notification notif() {
        Intent oi = new Intent(this, MainActivity.class);
        oi.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(this, 0, oi, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        b.setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle((paused ? "Pausado · " : "Gravando · ") + label())
            .setContentText(String.format(BR, "%.2f km · %s", dist / 1000, clock(moving)))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setContentIntent(pi);
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        return b.build();
    }

    static String clock(double sec) {
        int s = (int) sec;
        return s >= 3600 ? String.format(BR, "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60) : String.format(BR, "%02d:%02d", s / 60, s % 60);
    }

    static String n(double v) {
        if (Double.isNaN(v) || Double.isInfinite(v)) return "0";
        return String.valueOf(v);
    }

    void head(StringBuilder b) {
        b.append("{\"active\":true,\"type\":\"").append(type).append("\",\"paused\":").append(paused)
            .append(",\"auto\":").append(autoP && !paused)
            .append(",\"start\":").append(start)
            .append(",\"elapsed\":").append(n(elapsed)).append(",\"moving\":").append(n(moving))
            .append(",\"dist\":").append(n(dist)).append(",\"elev\":").append(n(elev))
            .append(",\"hasSteps\":").append(hasSteps).append(",\"steps\":").append(steps)
            .append(",\"cad\":").append(cad()).append(",\"speed\":").append(n(speed))
            .append(",\"acc\":").append(n(acc)).append(",\"fix\":").append(hasFix && System.currentTimeMillis() - lastFixT < 10000)
            .append(",\"n\":").append(pts.size()).append(",\"splits\":[");
        for (int i = 0; i < splits.size(); i++) {
            double[] s = splits.get(i);
            if (i > 0) b.append(',');
            b.append('[').append((int) s[0]).append(',').append(n(s[1])).append(',').append((int) s[2]).append(',').append(n(s[3])).append(']');
        }
        b.append(']');
    }

    synchronized String state(int from) {
        StringBuilder b = new StringBuilder(4096);
        head(b);
        b.append(",\"pts\":[");
        for (int i = Math.max(0, from); i < pts.size(); i++) {
            double[] p = pts.get(i);
            if (i > from) b.append(',');
            b.append('[').append(n(p[0])).append(',').append(n(p[1])).append(']');
        }
        return b.append("]}").toString();
    }

    synchronized String full() {
        StringBuilder b = new StringBuilder(pts.size() * 64 + 1024);
        head(b);
        b.append(",\"end\":").append(System.currentTimeMillis()).append(",\"pts\":[");
        for (int i = 0; i < pts.size(); i++) {
            double[] p = pts.get(i);
            if (i > 0) b.append(',');
            b.append('[').append(n(p[0])).append(',').append(n(p[1])).append(',').append(Math.round(p[2])).append(',').append(n(p[3])).append(',').append(Math.round(p[4] * 10) / 10.0).append(']');
        }
        return b.append("]}").toString();
    }

    void save(String json) {
        try {
            File f = activeFile(this), tmp = new File(f.getPath() + ".tmp");
            FileOutputStream os = new FileOutputStream(tmp);
            os.write(json.getBytes("UTF-8"));
            os.getFD().sync();
            os.close();
            if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f); }
        } catch (Exception e) { }
    }

    synchronized void pause() { paused = true; autoP = false; try { nm.notify(NID, notif()); } catch (Exception e) { } }

    synchronized void resume() {
        paused = false;
        last = null;
        lastMoveMs = System.currentTimeMillis();
        try { nm.notify(NID, notif()); } catch (Exception e) { }
    }

    synchronized void setVoice(boolean v) {
        voice = v;
        if (v && tts == null) tts = new TextToSpeech(this, this);
    }

    String stop() {
        String j;
        synchronized (this) { j = full(); }
        save(j);
        cleanup();
        inst = null;
        try { stopForeground(true); } catch (Exception e) { }
        stopSelf();
        return j;
    }

    void cleanup() {
        try { if (h != null) h.removeCallbacks(tick); } catch (Exception e) { }
        try { if (lm != null) lm.removeUpdates(this); } catch (Exception e) { }
        try { if (sm != null) sm.unregisterListener(this); } catch (Exception e) { }
        try { if (tts != null) tts.shutdown(); } catch (Exception e) { }
        h = null;
    }

    @Override
    public void onDestroy() {
        if (inst == this) { save(full()); inst = null; }
        cleanup();
        super.onDestroy();
    }
}
