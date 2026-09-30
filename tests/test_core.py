import httpx, math, sys, time

UA = {"User-Agent": "HoopByTreesh/1.0 (https://treesh.app/hoop)"}
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"]


def hav(a, b, c, d):
    R = 6371000
    p1, p2 = math.radians(a), math.radians(c)
    dp, dl = math.radians(c - a), math.radians(d - b)
    x = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))


def geocode(q):
    r = httpx.get("https://nominatim.openstreetmap.org/search", params={"q": q, "format": "jsonv2", "limit": 1}, headers=UA, timeout=15)
    r.raise_for_status()
    j = r.json()
    assert j, f"no geocode for {q}"
    return float(j[0]["lat"]), float(j[0]["lon"]), j[0]["display_name"]


def reverse(lat, lon):
    r = httpx.get("https://nominatim.openstreetmap.org/reverse", params={"lat": lat, "lon": lon, "format": "jsonv2"}, headers=UA, timeout=15)
    r.raise_for_status()
    return r.json().get("display_name")


def courts(lat, lon, radius=5000):
    q = f"""[out:json][timeout:25];
(
 nwr["sport"~"basketball"](around:{radius},{lat},{lon});
);
out center tags 200;"""
    last = None
    for url in OVERPASS:
        try:
            t = time.time()
            r = httpx.post(url, data={"data": q}, headers=UA, timeout=30)
            r.raise_for_status()
            els = r.json()["elements"]
            print(f"   overpass {url} ok in {time.time()-t:.1f}s")
            out = []
            for e in els:
                la = e.get("lat") or e.get("center", {}).get("lat")
                lo = e.get("lon") or e.get("center", {}).get("lon")
                if la is None:
                    continue
                out.append((hav(lat, lon, la, lo), e.get("tags", {}).get("name", "Basketball court"), e.get("tags", {})))
            return sorted(out, key=lambda x: x[0])
        except Exception as ex:
            last = ex
            print(f"   overpass {url} failed: {ex}")
    raise last


ok = True
for addr in ["Rucker Park, New York", "Venice Beach, Los Angeles", "Chicago, IL", "London, UK"]:
    try:
        lat, lon, name = geocode(addr)
        print(f"[geocode] {addr} -> {lat:.4f},{lon:.4f}")
        time.sleep(1.1)
        res = courts(lat, lon, 4000)
        print(f"[courts] {len(res)} found; nearest: {[ (round(d), n) for d,n,_ in res[:3]]}")
        assert len(res) > 0
        time.sleep(1.1)
    except Exception as e:
        ok = False
        print("FAIL", addr, e)
print("[reverse]", reverse(40.8296, -73.9362))
print("SUCCESS" if ok else "FAILURES")
sys.exit(0 if ok else 1)
