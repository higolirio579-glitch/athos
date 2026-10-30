package br.higo.ficha;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;

/** Entrega o APK baixado da atualização para o instalador do Android (somente leitura). */
public class ApkProvider extends ContentProvider {
    static final String AUTH = "br.higo.ficha.update";
    static final String NAME = "ATHOS.apk";

    static File file(android.content.Context c) {
        File d = new File(c.getCacheDir(), "update");
        d.mkdirs();
        return new File(d, NAME);
    }

    static final String SHARE = "athos-story.png";

    static File shareFile(android.content.Context c) {
        File d = new File(c.getCacheDir(), "share");
        d.mkdirs();
        return new File(d, SHARE);
    }

    static final String CAM = "athos-cam.jpg";

    static File camFile(android.content.Context c) {
        File d = new File(c.getCacheDir(), "cam");
        d.mkdirs();
        return new File(d, CAM);
    }

    static Uri camUri() { return Uri.parse("content://" + AUTH + "/" + CAM); }

    static Uri uri() { return Uri.parse("content://" + AUTH + "/" + NAME); }
    static Uri shareUri() { return Uri.parse("content://" + AUTH + "/" + SHARE); }

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri u) {
        String n = u.getLastPathSegment();
        if (CAM.equals(n)) return "image/jpeg";
        return SHARE.equals(n) ? "image/png" : "application/vnd.android.package-archive";
    }

    @Override
    public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
        String n = u.getLastPathSegment();
        if (CAM.equals(n)) {
            File f = camFile(getContext());
            int m = mode != null && mode.contains("w") ? ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_CREATE | (mode.contains("t") ? ParcelFileDescriptor.MODE_TRUNCATE : 0) : ParcelFileDescriptor.MODE_READ_ONLY;
            return ParcelFileDescriptor.open(f, m);
        }
        if (SHARE.equals(n)) return ParcelFileDescriptor.open(shareFile(getContext()), ParcelFileDescriptor.MODE_READ_ONLY);
        if (!NAME.equals(n)) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(file(getContext()), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Cursor query(Uri u, String[] proj, String sel, String[] args, String sort) {
        String n = u.getLastPathSegment();
        boolean sh = SHARE.equals(n), cam = CAM.equals(n);
        File f = cam ? camFile(getContext()) : sh ? shareFile(getContext()) : file(getContext());
        MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        c.addRow(new Object[]{cam ? "foto-" + f.lastModified() + ".jpg" : sh ? SHARE : NAME, f.length()});
        return c;
    }

    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
