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

    static Uri uri() { return Uri.parse("content://" + AUTH + "/" + NAME); }

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri u) { return "application/vnd.android.package-archive"; }

    @Override
    public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
        if (!NAME.equals(u.getLastPathSegment())) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(file(getContext()), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Cursor query(Uri u, String[] proj, String sel, String[] args, String sort) {
        File f = file(getContext());
        MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        c.addRow(new Object[]{NAME, f.length()});
        return c;
    }

    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
