import numpy as np
from PIL import Image
from collections import deque
import sys, base64, io
def key(src, T=46):
    im=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    H,W,_=im.shape; mx=im.max(axis=2)
    bg=np.zeros((H,W),bool); q=deque()
    for x in range(W):
        for y in (0,H-1):
            if mx[y,x]<T and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if mx[y,x]<T and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<H and 0<=nx<W and not bg[ny,nx] and mx[ny,nx]<T: bg[ny,nx]=True; q.append((ny,nx))
    a=np.where(bg, np.clip((mx-8)/(T-8),0,1), 1.0)
    rgb=np.where(a[...,None]>0, np.clip(im/np.maximum(a[...,None],1e-3),0,255), 0)
    out=np.dstack([rgb, a*255]).astype(np.uint8)
    img=Image.fromarray(out,'RGBA'); bb=img.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox()
    img=img.crop(bb); img.thumbnail((460,460),Image.LANCZOS); return img
for n in ['eb3d','bb3d','sn3d']:
    img=key(f'/tmp/art/{n}.jpg'); img.save(f'/tmp/art/{n}.webp','WEBP',quality=86,method=6)
    pv=Image.new('RGBA',(img.width,img.height),(70,40,110,255)); pv.alpha_composite(img); pv.convert('RGB').save(f'/tmp/art/{n}_pv.png')
    print(n,img.size,len(open(f'/tmp/art/{n}.webp','rb').read()))
