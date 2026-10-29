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

    static Uri uri() { return Uri.parse("content://" + AUTH + "/" + NAME); }
    static Uri shareUri() { return Uri.parse("content://" + AUTH + "/" + SHARE); }

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri u) { return SHARE.equals(u.getLastPathSegment()) ? "image/png" : "application/vnd.android.package-archive"; }

    @Override
    public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
        String n = u.getLastPathSegment();
        if (SHARE.equals(n)) return ParcelFileDescriptor.open(shareFile(getContext()), ParcelFileDescriptor.MODE_READ_ONLY);
        if (!NAME.equals(n)) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(file(getContext()), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Cursor query(Uri u, String[] proj, String sel, String[] args, String sort) {
        boolean sh = SHARE.equals(u.getLastPathSegment());
        File f = sh ? shareFile(getContext()) : file(getContext());
        MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        c.addRow(new Object[]{sh ? SHARE : NAME, f.length()});
        return c;
    }

    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
