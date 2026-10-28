from PIL import Image, ImageDraw
import os
R='/home/claude/apk/proj/res'
BG=(18,21,26,255); RED=(255,102,86,255); BLUE=(93,133,255,255); YEL=(240,188,46,255); BAR=(153,162,177,255)
def mark(d,cx,cy,u):
    # anilhas na barra: vermelho, azul, amarelo + ponta da barra
    plates=[(RED,22),(BLUE,18),(YEL,14)]
    w=6*u; gap=2*u
    total=3*w+2*gap+gap+12*u
    x=cx-total/2
    d.rectangle([x, cy-1.5*u, x+total, cy+1.5*u], fill=BAR)
    for c,h in plates:
        d.rounded_rectangle([x, cy-h*u/2, x+w, cy+h*u/2], radius=2*u, fill=c); x+=w+gap
def legacy(size):
    S=size*8; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle([0,0,S-1,S-1],radius=S*0.22,fill=BG)
    mark(d,S/2,S/2,S/46)
    return im.resize((size,size),Image.LANCZOS)
def fg(size):  # 108dp canvas, conteúdo no centro
    S=size*8; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    mark(d,S/2,S/2,S/80)
    return im.resize((size,size),Image.LANCZOS)
for q,s in {'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}.items():
    os.makedirs(f'{R}/mipmap-{q}',exist_ok=True)
    legacy(s).save(f'{R}/mipmap-{q}/ic_launcher.png')
    fg(int(s*108/48)).save(f'{R}/mipmap-{q}/ic_launcher_fg.png')
os.makedirs(f'{R}/mipmap-anydpi-v26',exist_ok=True)
open(f'{R}/mipmap-anydpi-v26/ic_launcher.xml','w').write('''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/icon_bg" />
    <foreground android:drawable="@mipmap/ic_launcher_fg" />
</adaptive-icon>
''')
legacy(512).save('/home/claude/apk/icon_preview.png')
print('icons ok')
