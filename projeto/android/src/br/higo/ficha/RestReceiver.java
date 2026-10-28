package br.higo.ficha;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Dispara quando o descanso entre séries termina. */
public class RestReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (MainActivity.visible) return;
        Notif.post(c, 7001, Notif.CH_REST, "Descanso acabou", "Bora para a próxima série!", "treino");
    }
}
