#!/usr/bin/env bash
# Gera o ATHOS.apk. Requisitos (Ubuntu): apt install aapt apksigner zipalign dalvik-exchange openjdk-21-jdk python3
# android.jar (API 34): baixe de https://raw.githubusercontent.com/Sable/android-platforms/master/android-34/android.jar para ./sdk/android.jar
# Chave: coloque ficha.jks nesta pasta e rode:  ATHOS_KS_PASS='sua_senha' ./build_apk.sh
set -euo pipefail
cd "$(dirname "$0")"
: "${ATHOS_KS_PASS:?defina ATHOS_KS_PASS com a senha da chave}"
AJ=sdk/android.jar
python3 build_html.py && python3 build_web.py
cd android && rm -rf build gen && mkdir -p build/classes gen
aapt package -f -M AndroidManifest.xml -S res -A assets -I ../$AJ -J gen -F build/unsigned.apk
javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath ../$AJ -d build/classes src/br/higo/ficha/*.java
dalvik-exchange --dex --min-sdk-version=24 --output=build/classes.dex build/classes
(cd build && aapt add -f unsigned.apk classes.dex >/dev/null && zipalign -f 4 unsigned.apk aligned.apk)
apksigner sign --ks ../ficha.jks --ks-pass env:ATHOS_KS_PASS --ks-key-alias ficha --out ../ATHOS.apk build/aligned.apk
cd .. && apksigner verify ATHOS.apk && echo "Pronto: ATHOS.apk"
