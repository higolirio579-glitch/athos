package br.higo.ficha;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.SharedPreferences;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.ArrayList;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int REQ_FILE = 1, REQ_SAVE = 2, REQ_PERM = 3, REQ_NOTIF = 4, REQ_CAM = 5;
    private PermissionRequest pendingCam;
    private static final Charset UTF8 = Charset.forName("UTF-8");
    static final String HOST = "appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> fileCb;
    private String pendingSave, pendingPerm;
    private boolean dark;
    private volatile boolean updBusy;
    static volatile boolean visible;
    private String pendingOpen;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        dark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int bg = dark ? 0xFF000000 : 0xFFEEEFF1;
        Window w = getWindow();
        w.setStatusBarColor(bg);
        w.setNavigationBarColor(bg);
        View decor = w.getDecorView();
        int flags = decor.getSystemUiVisibility();
        if (!dark) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        decor.setSystemUiVisibility(flags);

        web = new WebView(this);
        web.setBackgroundColor(bg);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " ATHOS/2.2 (br.higo.ficha; uso pessoal)");
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                Uri u = Uri.parse(url);
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
                String mime = mime(path);
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    return new WebResourceResponse(mime, mime.startsWith("text") || mime.endsWith("javascript") ? "utf-8" : null, in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest r) {
                runOnUiThread(new Runnable() {
                    public void run() {
                        boolean cam = false;
                        for (String x : r.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(x)) cam = true;
                        if (!cam) { r.deny(); return; }
                        if (granted(Manifest.permission.CAMERA)) r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                        else { pendingCam = r; requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAM); }
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                boolean img = false;
                String[] acc = params.getAcceptTypes();
                if (acc != null) for (String a : acc) if (a != null && a.startsWith("image")) img = true;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(img ? "image/*" : "*/*");
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(Intent.createChooser(i, img ? "Escolher fotos" : "Escolher arquivo"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });
        setContentView(web);
        web.loadUrl("https://" + HOST + "/index.html");
        Notif.channels(this);
        Notif.schedule(this);
        pendingOpen = getIntent() != null ? getIntent().getStringExtra("open") : null;
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        String o = i.getStringExtra("open");
        if (o != null) js("window.androidOpen&&window.androidOpen(" + JSONObject.quote(o) + ")");
    }

    @Override
    protected void onPause() {
        super.onPause();
        visible = false;
    }

    static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    void js(final String code) {
        runOnUiThread(new Runnable() { public void run() { web.evaluateJavascript(code, null); } });
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.androidBack&&window.androidBack())?'1':'0'", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (v == null || !v.contains("1")) moveTaskToBack(true);
            }
        });
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE) {
            if (fileCb != null) {
                Uri[] r = null;
                if (res == RESULT_OK && data != null) {
                    ClipData cd = data.getClipData();
                    if (cd != null && cd.getItemCount() > 0) {
                        r = new Uri[cd.getItemCount()];
                        for (int i = 0; i < r.length; i++) r[i] = cd.getItemAt(i).getUri();
                    } else if (data.getData() != null) r = new Uri[]{data.getData()};
                }
                fileCb.onReceiveValue(r);
                fileCb = null;
            }
        } else if (req == REQ_SAVE) {
            boolean ok = false;
            if (res == RESULT_OK && data != null && data.getData() != null && pendingSave != null) {
                try {
                    OutputStream os = getContentResolver().openOutputStream(data.getData(), "wt");
                    os.write(pendingSave.getBytes(UTF8));
                    os.close();
                    ok = true;
                } catch (Exception e) { ok = false; }
            }
            pendingSave = null;
            js("window.androidSaved&&window.androidSaved(" + ok + ")");
        } else {
            super.onActivityResult(req, res, data);
        }
    }

    boolean granted(String p) { return checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED; }

    String permState() {
        boolean loc = granted(Manifest.permission.ACCESS_FINE_LOCATION) || granted(Manifest.permission.ACCESS_COARSE_LOCATION);
        boolean fine = granted(Manifest.permission.ACCESS_FINE_LOCATION);
        boolean steps = Build.VERSION.SDK_INT < 29 || granted(Manifest.permission.ACTIVITY_RECOGNITION);
        boolean notif = Build.VERSION.SDK_INT < 33 || granted(Manifest.permission.POST_NOTIFICATIONS);
        return "{\"loc\":" + loc + ",\"fine\":" + fine + ",\"steps\":" + steps + ",\"notif\":" + notif + "}";
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        if (req == REQ_CAM) {
            if (pendingCam != null) {
                if (granted(Manifest.permission.CAMERA)) pendingCam.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                else pendingCam.deny();
                pendingCam = null;
            }
            return;
        }
        if (req == REQ_NOTIF) { js("window.androidNotifPerm&&window.androidNotifPerm(" + Notif.allowed(this) + ")"); return; }
        if (req == REQ_PERM && pendingPerm != null) {
            js("window.androidPermDone&&window.androidPermDone(" + JSONObject.quote(pendingPerm) + "," + permState() + ")");
            pendingPerm = null;
        }
    }

    private File store(String key) {
        return new File(getFilesDir(), key.replaceAll("[^A-Za-z0-9._-]", "_") + ".json");
    }

    static String readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] b = new byte[16384];
        int n;
        while ((n = in.read(b)) > 0) bo.write(b, 0, n);
        in.close();
        return new String(bo.toByteArray(), UTF8);
    }

    class Bridge {
        @JavascriptInterface
        public String getItem(String key) {
            File f = store(key);
            if (!f.exists()) return null;
            try { return readAll(new FileInputStream(f)); } catch (Exception e) { return null; }
        }

        @JavascriptInterface
        public synchronized void setItem(String key, String value) {
            File f = store(key);
            if (value == null) { f.delete(); return; }
            File tmp = new File(f.getPath() + ".tmp");
            try {
                FileOutputStream os = new FileOutputStream(tmp);
                os.write(value.getBytes(UTF8));
                os.getFD().sync();
                os.close();
                if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f); }
            } catch (Exception e) { }
        }

        @JavascriptInterface
        public boolean isDark() { return dark; }

        @JavascriptInterface
        public void keepAwake(final boolean on) {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
        }

        @JavascriptInterface
        public void vibrate() {
            try {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null) v.vibrate(new long[]{0, 200, 100, 200}, -1);
            } catch (Exception e) { }
        }

        @JavascriptInterface
        public void saveFile(final String name, final String content) {
            runOnUiThread(new Runnable() {
                public void run() {
                    pendingSave = content;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("application/json");
                    i.putExtra(Intent.EXTRA_TITLE, name);
                    try { startActivityForResult(i, REQ_SAVE); }
                    catch (ActivityNotFoundException e) {
                        pendingSave = null;
                        web.evaluateJavascript("window.androidSaved&&window.androidSaved(false)", null);
                    }
                }
            });
        }

        @JavascriptInterface
        public void http(final String id, final String url, final String body, final String headers) {
            new Thread(new Runnable() {
                public void run() {
                    int status = -1;
                    String text = "";
                    try {
                        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                        c.setConnectTimeout(20000);
                        c.setReadTimeout(150000);
                        if (headers != null && headers.length() > 2) {
                            JSONObject hj = new JSONObject(headers);
                            java.util.Iterator<String> it = hj.keys();
                            while (it.hasNext()) { String k = it.next(); c.setRequestProperty(k, hj.getString(k)); }
                        }
                        c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                        if (body != null) {
                            c.setRequestMethod("POST");
                            c.setDoOutput(true);
                            OutputStream os = c.getOutputStream();
                            os.write(body.getBytes(UTF8));
                            os.close();
                        }
                        status = c.getResponseCode();
                        InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                        text = in == null ? "" : readAll(in);
                    } catch (Exception e) {
                        status = -1;
                        text = String.valueOf(e.getMessage());
                    }
                    js("window.androidHttpDone&&window.androidHttpDone(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(text) + ")");
                }
            }).start();
        }

        /* ----- gravação de atividades com GPS ----- */
        @JavascriptInterface
        public void runPermissions(final String id) {
            runOnUiThread(new Runnable() {
                public void run() {
                    ArrayList<String> need = new ArrayList<String>();
                    if (!granted(Manifest.permission.ACCESS_FINE_LOCATION)) {
                        need.add(Manifest.permission.ACCESS_FINE_LOCATION);
                        need.add(Manifest.permission.ACCESS_COARSE_LOCATION);
                    }
                    if (Build.VERSION.SDK_INT >= 29 && !granted(Manifest.permission.ACTIVITY_RECOGNITION)) need.add(Manifest.permission.ACTIVITY_RECOGNITION);
                    if (Build.VERSION.SDK_INT >= 33 && !granted(Manifest.permission.POST_NOTIFICATIONS)) need.add(Manifest.permission.POST_NOTIFICATIONS);
                    if (need.isEmpty()) {
                        web.evaluateJavascript("window.androidPermDone&&window.androidPermDone(" + JSONObject.quote(id) + "," + permState() + ")", null);
                        return;
                    }
                    pendingPerm = id;
                    requestPermissions(need.toArray(new String[0]), REQ_PERM);
                }
            });
        }

        @JavascriptInterface
        public boolean gpsOn() {
            try {
                LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
                return lm.isProviderEnabled(LocationManager.GPS_PROVIDER);
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface
        public void openLocationSettings() {
            runOnUiThread(new Runnable() {
                public void run() {
                    try { startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); } catch (Exception e) { }
                }
            });
        }

        @JavascriptInterface
        public boolean runStart(String type, boolean voice) {
            if (RunService.inst != null || RunService.starting) return true;
            try {
                RunService.activeFile(MainActivity.this).delete();
                Intent i = new Intent(MainActivity.this, RunService.class);
                i.putExtra("type", type);
                i.putExtra("voice", voice);
                RunService.starting = true;
                RunService.startingType = type;
                if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
                return true;
            } catch (Exception e) {
                RunService.starting = false;
                return false;
            }
        }

        @JavascriptInterface
        public boolean runActive() { return RunService.inst != null || RunService.starting; }

        @JavascriptInterface
        public String runState(int from) {
            RunService r = RunService.inst;
            if (r != null) return r.state(from);
            if (RunService.starting)
                return "{\"active\":true,\"starting\":true,\"type\":\"" + RunService.startingType + "\",\"paused\":false,\"auto\":false,\"start\":" + System.currentTimeMillis()
                    + ",\"elapsed\":0,\"moving\":0,\"dist\":0,\"elev\":0,\"hasSteps\":false,\"steps\":0,\"cad\":0,\"speed\":0,\"acc\":999,\"fix\":false,\"n\":0,\"splits\":[],\"pts\":[]}";
            return "{\"active\":false}";
        }

        @JavascriptInterface
        public void runPause() { RunService r = RunService.inst; if (r != null) r.pause(); }

        @JavascriptInterface
        public void runResume() { RunService r = RunService.inst; if (r != null) r.resume(); }

        @JavascriptInterface
        public void runVoice(boolean on) { RunService r = RunService.inst; if (r != null) r.setVoice(on); }

        @JavascriptInterface
        public String runStop() {
            RunService r = RunService.inst;
            if (r != null) return r.stop();
            return getRecovered();
        }

        @JavascriptInterface
        public String runRecovered() {
            if (RunService.inst != null || RunService.starting) return null;
            return getRecovered();
        }

        @JavascriptInterface
        public void runClear() { RunService.activeFile(MainActivity.this).delete(); }

        /* ----- notificações ----- */
        @JavascriptInterface
        public boolean notifAllowed() { return Notif.allowed(MainActivity.this); }

        @JavascriptInterface
        public void notifPermission() {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (Build.VERSION.SDK_INT >= 33 && !granted("android.permission.POST_NOTIFICATIONS")) {
                        requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_NOTIF);
                    } else if (!Notif.allowed(MainActivity.this)) {
                        try {
                            Intent i = new Intent("android.settings.APP_NOTIFICATION_SETTINGS");
                            i.putExtra("android.provider.extra.APP_PACKAGE", getPackageName());
                            startActivity(i);
                        } catch (Exception e) { }
                        js("window.androidNotifPerm&&window.androidNotifPerm(false)");
                    } else js("window.androidNotifPerm&&window.androidNotifPerm(true)");
                }
            });
        }

        @JavascriptInterface
        public void notifState(String json) {
            try {
                JSONObject o = new JSONObject(json);
                boolean soc = o.optJSONObject("prefs") == null || o.optJSONObject("prefs").optBoolean("social", true);
                Notif.prefs(MainActivity.this).edit().putString("state", json).putBoolean("soc_on", soc && o.optBoolean("logged", false)).apply();
            } catch (Exception e) { }
        }

        @JavascriptInterface
        public String notifKey() { return Notif.key(MainActivity.this); }

        @JavascriptInterface
        public void notifResetKey() { Notif.prefs(MainActivity.this).edit().remove("dev_key").putLong("soc_after", 0).putBoolean("soc_on", false).apply(); }

        @JavascriptInterface
        public void notifSetAfter(double id) {
            SharedPreferences sp = Notif.prefs(MainActivity.this);
            if ((long) id > sp.getLong("soc_after", 0)) sp.edit().putLong("soc_after", (long) id).apply();
        }

        @JavascriptInterface
        public void ppCloud(int n) { Notif.prefs(MainActivity.this).edit().putInt("pp_cloud", n).apply(); }

        @JavascriptInterface
        public String takeOpen() { String o = pendingOpen; pendingOpen = null; return o; }

        @JavascriptInterface
        public void restAlarm(double endMs, boolean on) {
            AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
            PendingIntent pi = restPi();
            am.cancel(pi);
            Notif.cancel(MainActivity.this, 7001);
            if (!on) return;
            long t = (long) endMs;
            try {
                if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, pi);
                else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, pi);
            } catch (Exception e) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, pi);
            }
        }

        @JavascriptInterface
        public void restCancel() {
            ((AlarmManager) getSystemService(ALARM_SERVICE)).cancel(restPi());
        }

        /* ----- compartilhar imagem nos stories ----- */
        @JavascriptInterface
        public void shareImage(final String b64, final String text) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        byte[] data = android.util.Base64.decode(b64, android.util.Base64.DEFAULT);
                        FileOutputStream os = new FileOutputStream(ApkProvider.shareFile(MainActivity.this));
                        os.write(data);
                        os.close();
                        Intent i = new Intent(Intent.ACTION_SEND);
                        i.setType("image/png");
                        i.putExtra(Intent.EXTRA_STREAM, ApkProvider.shareUri());
                        i.setClipData(ClipData.newRawUri("ATHOS", ApkProvider.shareUri()));
                        if (text != null) i.putExtra(Intent.EXTRA_TEXT, text);
                        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        Intent ch = Intent.createChooser(i, "Compartilhar");
                        ch.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivity(ch);
                    } catch (Exception e) {
                        web.evaluateJavascript("toast&&0", null);
                    }
                }
            });
        }

        /* ----- aparência e versão ----- */
        @JavascriptInterface
        public String appVersionName() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }

        @JavascriptInterface
        public void setBars(final boolean d) {
            runOnUiThread(new Runnable() {
                public void run() {
                    int bg = d ? 0xFF000000 : 0xFFEEEFF1;
                    Window w = getWindow();
                    w.setStatusBarColor(bg);
                    w.setNavigationBarColor(bg);
                    web.setBackgroundColor(bg);
                    View decor = w.getDecorView();
                    int f = decor.getSystemUiVisibility();
                    if (d) {
                        f &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        if (Build.VERSION.SDK_INT >= 26) f &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    } else {
                        f |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        if (Build.VERSION.SDK_INT >= 26) f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    decor.setSystemUiVisibility(f);
                }
            });
        }

        /* ----- música (YouTube Music, Spotify...) ----- */
        @JavascriptInterface
        public String musicState() { return Music.state(MainActivity.this); }

        @JavascriptInterface
        public void musicKey(final String which) {
            runOnUiThread(new Runnable() { public void run() { try { Music.key(MainActivity.this, which); } catch (Exception e) { } } });
        }

        @JavascriptInterface
        public void musicPerm() {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        Intent i;
                        if (Build.VERSION.SDK_INT >= 30) {
                            i = new Intent("android.settings.NOTIFICATION_LISTENER_DETAIL_SETTINGS");
                            i.putExtra("android.provider.extra.NOTIFICATION_LISTENER_COMPONENT_NAME", new android.content.ComponentName(MainActivity.this, MediaListener.class).flattenToString());
                        } else i = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                        startActivity(i);
                    } catch (Exception e) {
                        try { startActivity(new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")); } catch (Exception e2) { }
                    }
                }
            });
        }

        @JavascriptInterface
        public void appSettings() {
            runOnUiThread(new Runnable() {
                public void run() {
                    try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); } catch (Exception e) { }
                }
            });
        }

        @JavascriptInterface
        public void openUrl(final String url) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception e) { }
                }
            });
        }

        /* ----- atualização do app ----- */
        @JavascriptInterface
        public int appVersion() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
        }

        @JavascriptInterface
        public void updateDownload(final String url) {
            if (updBusy) return;
            updBusy = true;
            new Thread(new Runnable() {
                public void run() {
                    File out = ApkProvider.file(MainActivity.this);
                    File tmp = new File(out.getPath() + ".part");
                    try {
                        String u = url;
                        HttpURLConnection c = null;
                        for (int hop = 0; hop < 5; hop++) {
                            c = (HttpURLConnection) new URL(u).openConnection();
                            c.setInstanceFollowRedirects(false);
                            c.setConnectTimeout(20000);
                            c.setReadTimeout(60000);
                            int st = c.getResponseCode();
                            if (st >= 300 && st < 400 && c.getHeaderField("Location") != null) {
                                u = new URL(new URL(u), c.getHeaderField("Location")).toString();
                                c.disconnect();
                                continue;
                            }
                            if (st != 200) throw new IOException("HTTP " + st);
                            break;
                        }
                        long total = c.getContentLength();
                        InputStream in = c.getInputStream();
                        FileOutputStream os = new FileOutputStream(tmp);
                        byte[] b = new byte[32768];
                        long got = 0;
                        int n, last = -1;
                        while ((n = in.read(b)) > 0) {
                            os.write(b, 0, n);
                            got += n;
                            int pct = total > 0 ? (int) (got * 100 / total) : -1;
                            if (pct != last) { last = pct; js("window.androidUpd&&window.androidUpd('progress'," + pct + ")"); }
                        }
                        os.getFD().sync();
                        os.close();
                        in.close();
                        if (got < 100000) throw new IOException("arquivo incompleto");
                        out.delete();
                        if (!tmp.renameTo(out)) throw new IOException("falha ao salvar");
                        js("window.androidUpd&&window.androidUpd('done',100)");
                    } catch (Exception e) {
                        tmp.delete();
                        js("window.androidUpd&&window.androidUpd('error'," + JSONObject.quote(String.valueOf(e.getMessage())) + ")");
                    } finally {
                        updBusy = false;
                    }
                }
            }).start();
        }

        @JavascriptInterface
        public String updateInstall() {
            if (!ApkProvider.file(MainActivity.this).exists()) return "missing";
            if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
                runOnUiThread(new Runnable() {
                    public void run() {
                        try {
                            startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
                        } catch (Exception e) { }
                    }
                });
                return "need_permission";
            }
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW);
                        i.setDataAndType(ApkProvider.uri(), "application/vnd.android.package-archive");
                        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i);
                    } catch (Exception e) {
                        web.evaluateJavascript("window.androidUpd&&window.androidUpd('error','instalador indisponível')", null);
                    }
                }
            });
            return "ok";
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        visible = true;
        Notif.prefs(this).edit().putLong("last_open", System.currentTimeMillis()).remove("pp_warned").apply();
        if (web != null) web.evaluateJavascript("window.androidResume&&window.androidResume()", null);
    }

    PendingIntent restPi() {
        return PendingIntent.getBroadcast(this, 7001, new Intent(this, RestReceiver.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    String getRecovered() {
        File f = RunService.activeFile(this);
        if (!f.exists()) return null;
        try { return readAll(new FileInputStream(f)); } catch (Exception e) { return null; }
    }
}
