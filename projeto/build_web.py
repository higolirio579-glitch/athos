import re,json
s=open('android/assets/index.html',encoding='utf8').read()
def r(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:60],s.count(a));s=s.replace(a,b)
s=re.sub(r"<script>try\{if\(window\.Android&&Android\.isDark\(\)\).*?</script>","",s,count=1,flags=re.S)
r('<link rel="stylesheet" href="leaflet/leaflet.css"><script src="leaflet/leaflet.js"></script><script src="supabase/supabase.js"></script>',
  '<link rel="stylesheet" href="leaflet/leaflet.css"><script src="leaflet/leaflet.js"></script><script src="supabase/supabase.js"></script>'
  '<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" href="icon-192.png">'
  '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="ATHOS">'
  '<meta name="theme-color" content="#EEEFF1" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)"><script>window.WEBAPP=true</script>')
assert '<script src="https:' not in s and 'fonts.googleapis' not in s
open('web/index.html','w',encoding='utf8').write(s)
json.dump({"name":"ATHOS","short_name":"ATHOS","start_url":"./","scope":"./","display":"standalone","background_color":"#0A0A0A","theme_color":"#0A0A0A","lang":"pt-BR",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},open('web/manifest.json','w'),ensure_ascii=False,indent=1)
import shutil,os
for d in ('leaflet','supabase','fonts','zxing'):
    dst='web/'+d
    if os.path.isdir(dst): shutil.rmtree(dst)
    shutil.copytree('android/assets/'+d,dst)
print('web ok',len(s))
