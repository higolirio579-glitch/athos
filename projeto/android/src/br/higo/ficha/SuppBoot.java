package br.higo.ficha;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Depois de reiniciar o celular ou atualizar o app, arma de novo os lembretes de suplementos. */
public class SuppBoot extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) SuppReceiver.scheduleAll(c);
    }
}
