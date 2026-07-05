"""Merge synced lyrics + artist bios/cashapp into seed_data.json."""
import re
import json
import html


def normalize_title(t):
    t = (t or "").lower()
    t = t.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    # remove (feat ...) / (ft ...) parentheticals
    t = re.sub(r"\((feat|ft|featuring)[^)]*\)", " ", t)
    # remove all non-alphanumeric
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def parse_ts(ts):
    # format MM:SS.ss  or  SS.ss
    ts = ts.strip()
    if not ts:
        return 0.0
    if ":" in ts:
        parts = ts.split(":")
        try:
            m = int(parts[0])
            s = float(parts[1])
            return round(m * 60 + s, 2)
        except Exception:
            return 0.0
    try:
        return round(float(ts), 2)
    except Exception:
        return 0.0


def parse_lyrics(path):
    content = open(path, encoding="utf-8").read()
    blocks = re.split(r'<div class="lyric"', content)
    result = {}
    for b in blocks[1:]:
        mt = re.search(r'data-track="([^"]*)"', b)
        if not mt:
            continue
        title = html.unescape(mt.group(1))
        # only take the part before the closing of this lyric div's inner content
        lines = []
        for m in re.finditer(r'<p data-minutes="([^"]*)">(.*?)</p>', b, re.S):
            ts = parse_ts(m.group(1))
            text = html.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip()
            if text:
                lines.append({"t": ts, "text": text})
        if lines:
            result[normalize_title(title)] = lines
    return result


def parse_artist_meta(path):
    content = open(path, encoding="utf-8").read()
    meta = {}
    for m in re.finditer(r'<article class="artist[^"]*"([^>]*)>', content):
        tag = m.group(0)
        aid = re.search(r'data-artist-id="([^"]*)"', tag)
        bio = re.search(r'data-bio="([^"]*)"', tag)
        cash = re.search(r'data-cashapp="([^"]*)"', tag)
        if aid:
            meta[aid.group(1)] = {
                "bio": html.unescape(bio.group(1)) if bio else "",
                "cashapp": cash.group(1) if cash else "",
            }
    return meta


lyrics = parse_lyrics("/app/lyrics_raw.txt")
artist_meta = parse_artist_meta("/app/icons2_raw.txt")

data = json.load(open("/app/backend/seed_data.json", encoding="utf-8"))

# attach lyrics to songs
matched = 0
for s in data["songs"]:
    key = normalize_title(s["title"])
    if key in lyrics:
        s["lyrics"] = lyrics[key]
        matched += 1
    else:
        s["lyrics"] = []

# enrich artists with bio + cashapp
for a in data["artists"]:
    m = artist_meta.get(a["artistId"], {})
    if m.get("bio") and not a.get("bio"):
        a["bio"] = m["bio"]
    a["cashapp"] = m.get("cashapp", "")

data["seedVersion"] = 2

json.dump(data, open("/app/backend/seed_data.json", "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"Lyrics parsed: {len(lyrics)} | matched to songs: {matched}/{len(data['songs'])}")
print("Artists with bio:", sum(1 for a in data['artists'] if a.get('bio')))
print("Artists with cashapp:", [a['name'] for a in data['artists'] if a.get('cashapp')])
# show unmatched lyric keys
song_keys = {normalize_title(s['title']) for s in data['songs']}
unmatched = [k for k in lyrics if k not in song_keys]
print("Unmatched lyric titles:", unmatched)
