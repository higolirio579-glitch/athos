package br.higo.ficha;

import android.content.ComponentName;
import android.content.Context;
import android.graphics.Bitmap;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Base64;
import android.view.KeyEvent;
import java.io.ByteArrayOutputStream;
import java.util.List;
import org.json.JSONObject;

/** Controle do player de música que estiver tocando (YouTube Music, Spotify, Deezer...). */
public class Music {
    private static String artKey = null, artB64 = null;

    static boolean allowed(Context c) {
        ComponentName cn = new ComponentName(c, MediaListener.class);
        try {
            if (android.os.Build.VERSION.SDK_INT >= 27) {
                android.app.NotificationManager nm = (android.app.NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm.isNotificationListenerAccessGranted(cn)) return true;
            }
        } catch (Exception e) { }
        try {
            String s = Settings.Secure.getString(c.getContentResolver(), "enabled_notification_listeners");
            if (s != null && (s.contains(cn.flattenToString()) || s.contains(cn.flattenToShortString()) || s.contains(c.getPackageName()))) return true;
        } catch (Exception e) { }
        try {
            MediaSessionManager m = (MediaSessionManager) c.getSystemService(Context.MEDIA_SESSION_SERVICE);
            m.getActiveSessions(cn);
            return true;
        } catch (Exception e) { return false; }
    }

    static MediaController controller(Context c) {
        if (!allowed(c)) return null;
        try {
            MediaSessionManager m = (MediaSessionManager) c.getSystemService(Context.MEDIA_SESSION_SERVICE);
            List<MediaController> list = m.getActiveSessions(new ComponentName(c, MediaListener.class));
            if (list == null || list.isEmpty()) return null;
            for (MediaController mc : list) {
                PlaybackState st = mc.getPlaybackState();
                if (st != null && st.getState() == PlaybackState.STATE_PLAYING) return mc;
            }
            return list.get(0);
        } catch (Exception e) { return null; }
    }

    static void key(Context c, String which) {
        MediaController mc = controller(c);
        if (mc != null) {
            MediaController.TransportControls t = mc.getTransportControls();
            PlaybackState st = mc.getPlaybackState();
            boolean playing = st != null && st.getState() == PlaybackState.STATE_PLAYING;
            if ("next".equals(which)) t.skipToNext();
            else if ("prev".equals(which)) t.skipToPrevious();
            else if (playing) t.pause(); else t.play();
            return;
        }
        int code = "next".equals(which) ? KeyEvent.KEYCODE_MEDIA_NEXT : "prev".equals(which) ? KeyEvent.KEYCODE_MEDIA_PREVIOUS : KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
        AudioManager am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
        long now = SystemClock.uptimeMillis();
        am.dispatchMediaKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_DOWN, code, 0));
        am.dispatchMediaKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_UP, code, 0));
    }

    static String state(Context c) {
        JSONObject o = new JSONObject();
        try {
            boolean ok = allowed(c);
            o.put("perm", ok);
            AudioManager am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
            o.put("active", am.isMusicActive());
            MediaController mc = ok ? controller(c) : null;
            if (mc != null) {
                o.put("pkg", mc.getPackageName());
                PlaybackState st = mc.getPlaybackState();
                o.put("playing", st != null && st.getState() == PlaybackState.STATE_PLAYING);
                MediaMetadata md = mc.getMetadata();
                if (md != null) {
                    String title = md.getString(MediaMetadata.METADATA_KEY_TITLE);
                    String artist = md.getString(MediaMetadata.METADATA_KEY_ARTIST);
                    if (artist == null) artist = md.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
                    o.put("title", title == null ? "" : title);
                    o.put("artist", artist == null ? "" : artist);
                    String k = mc.getPackageName() + "|" + title + "|" + artist;
                    if (!k.equals(artKey)) {
                        artKey = k;
                        artB64 = null;
                        Bitmap bm = md.getBitmap(MediaMetadata.METADATA_KEY_ART);
                        if (bm == null) bm = md.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
                        if (bm == null) bm = md.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON);
                        if (bm != null) {
                            Bitmap s = Bitmap.createScaledBitmap(bm, 120, 120, true);
                            ByteArrayOutputStream bo = new ByteArrayOutputStream();
                            s.compress(Bitmap.CompressFormat.JPEG, 80, bo);
                            artB64 = Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP);
                        }
                    }
                    if (artB64 != null) o.put("art", "data:image/jpeg;base64," + artB64);
                }
            } else o.put("playing", am.isMusicActive());
        } catch (Exception e) { }
        return o.toString();
    }
}
