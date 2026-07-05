"""Parse Treesh songs_raw.txt and icons_raw.txt into clean seed JSON."""
import re
import json
import html


def parse_attrs(tag_text):
    """Extract all data-* attributes from an opening tag string."""
    attrs = {}
    # match key="value"
    for m in re.finditer(r'([a-zA-Z0-9\-]+)\s*=\s*"([^"]*)"', tag_text):
        attrs[m.group(1).lower()] = html.unescape(m.group(2))
    # boolean attributes (no value): data-explicit, data-treeshchoice
    for m in re.finditer(r'\sdata-([a-zA-Z0-9\-]+)(?=[\s>])(?!\s*=)', tag_text):
        key = 'data-' + m.group(1).lower()
        if key not in attrs:
            attrs[key] = True
    return attrs


def parse_songs(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    songs = []
    # each song opening tag: <ul class="song" ...>
    for m in re.finditer(r'<ul class="song"([^>]*)>', content):
        tag = m.group(0)
        a = parse_attrs(tag)
        song = {
            'title': a.get('data-track', '').strip(),
            'artist': a.get('data-artist', '').strip(),
            'artistIds': [x.strip() for x in a.get('data-artist-id', '').split(',') if x.strip()],
            'genre': a.get('data-genre', '').strip().lower(),
            'mood': a.get('data-mood', '').strip(),
            'creationDate': a.get('data-creation-date', '').strip(),
            'writtenBy': a.get('data-written-by', '').strip(),
            'producer': a.get('data-producer', '').strip(),
            'mixer': a.get('data-mixer', '').strip(),
            'videographer': a.get('data-videographer', '').strip(),
            'featuring': a.get('data-featuring', '').strip(),
            'coverArt': a.get('data-coverart', '').strip(),
            'audioUrl': a.get('data-mp3', '').strip(),
            'videoId': a.get('data-video', '').strip(),
            'bio': a.get('data-bio', '').strip(),
            'explicit': bool(a.get('data-explicit', False)),
            'treeshChoice': bool(a.get('data-treeshchoice', False)),
        }
        if song['title'] and song['audioUrl']:
            songs.append(song)
    return songs


def parse_artists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    artists = []
    for m in re.finditer(r'<article class="artist[^"]*"([^>]*)>', content):
        tag = m.group(0)
        a = parse_attrs(tag)
        # capital label (role) is inside; try to grab it from the block after tag
        block = content[m.end():m.end()+800]
        role_m = re.search(r'<p class="capital">([^<]*)</p>', block)
        artist = {
            'artistId': a.get('data-artist-id', '').strip(),
            'name': a.get('data-name', '').strip(),
            'bio': a.get('data-bio', '').strip(),
            'background': a.get('data-bg', '').strip(),
            'bgPos': a.get('data-bg-pos', 'center center').strip(),
            'cashapp': a.get('data-cashapp', '').strip(),
            'role': (role_m.group(1).strip() if role_m else 'Music Artist'),
        }
        # thumbnail image
        img_m = re.search(r'<img class="artist__image" src="([^"]*)"', block)
        artist['image'] = img_m.group(1) if img_m else artist['background']
        if artist['name']:
            artists.append(artist)
    return artists


songs = parse_songs('/app/songs_raw.txt')
artists = parse_artists('/app/icons_raw.txt')

# collect genres
genres = sorted({s['genre'] for s in songs if s['genre']})

data = {'songs': songs, 'artists': artists, 'genres': genres}
with open('/app/backend/seed_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Parsed {len(songs)} songs, {len(artists)} artists")
print(f"Genres: {genres}")
print("Sample song:", json.dumps(songs[0], indent=2))
print("Sample artist:", json.dumps(artists[0], indent=2))
print("Artists with bios:", sum(1 for a in artists if a['bio']))
print("Songs w/ video:", sum(1 for s in songs if s['videoId']))
