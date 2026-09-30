import requests
import sys
import uuid

BASE_URL = "https://treesh-phase5.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.profile_id = str(uuid.uuid4())
        self.playlist_id = None

    def test(self, name, fn):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        try:
            fn()
            self.tests_passed += 1
            print(f"✅ Passed")
            return True
        except AssertionError as e:
            print(f"❌ Failed: {e}")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False

    def test_lyrics_synced(self):
        """Test GET /api/catalog/lyrics/{song_id} with synced lyrics"""
        def run():
            r = requests.get(f"{BASE_URL}/catalog/lyrics/chelly-banqz-shake-it-some-mo")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert "synced" in data, "Missing 'synced' field"
            assert data["synced"] == True, f"Expected synced=True, got {data['synced']}"
            assert "lyrics" in data, "Missing 'lyrics' field"
            assert isinstance(data["lyrics"], list), "lyrics should be a list"
            assert len(data["lyrics"]) > 0, "Expected lyrics array to have items"
            # Check first lyric has 't' and 'text'
            if len(data["lyrics"]) > 0:
                line = data["lyrics"][0]
                assert "t" in line, "Lyric line missing 't' field"
                assert "text" in line, "Lyric line missing 'text' field"
            print(f"   Found {len(data['lyrics'])} synced lyric lines")
        self.test("Lyrics - synced (chelly-banqz-shake-it-some-mo)", run)

    def test_lyrics_no_lyrics(self):
        """Test lyrics endpoint for song without lyrics"""
        def run():
            # Try to find a song without lyrics - we'll use the songs list
            r = requests.get(f"{BASE_URL}/catalog/songs")
            songs = r.json()
            # Try a few songs to find one without lyrics
            test_song = None
            for song in songs[:10]:
                lr = requests.get(f"{BASE_URL}/catalog/lyrics/{song['id']}")
                if lr.status_code == 200:
                    ldata = lr.json()
                    if not ldata.get("synced") or len(ldata.get("lyrics", [])) == 0:
                        test_song = song['id']
                        break
            if test_song:
                r = requests.get(f"{BASE_URL}/catalog/lyrics/{test_song}")
                data = r.json()
                assert data["synced"] == False, "Expected synced=False for song without lyrics"
                assert len(data.get("lyrics", [])) == 0, "Expected empty lyrics array"
                print(f"   Verified song {test_song} has no lyrics")
            else:
                print(f"   ⚠️  Could not find song without lyrics to test")
        self.test("Lyrics - no lyrics available", run)

    def test_lyrics_404(self):
        """Test lyrics endpoint with unknown song ID"""
        def run():
            r = requests.get(f"{BASE_URL}/catalog/lyrics/unknown-song-id-12345")
            assert r.status_code == 404, f"Expected 404, got {r.status_code}"
        self.test("Lyrics - 404 for unknown song", run)

    def test_songs_list(self):
        """Test GET /api/catalog/songs returns 57 songs without lyrics field"""
        def run():
            r = requests.get(f"{BASE_URL}/catalog/songs")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            songs = r.json()
            assert isinstance(songs, list), "Expected songs to be a list"
            assert len(songs) == 57, f"Expected 57 songs, got {len(songs)}"
            # Check that lyrics field is NOT in the response
            if len(songs) > 0:
                for song in songs[:5]:  # Check first 5 songs
                    assert "lyrics" not in song, f"Song {song.get('id')} should not have 'lyrics' field in list"
            print(f"   Verified {len(songs)} songs, no 'lyrics' field in items")
        self.test("Songs list - 57 songs, lean (no lyrics)", run)

    def test_artist_savionce(self):
        """Test GET /api/catalog/artists/3 returns SAVIONCE with cashapp & bio"""
        def run():
            r = requests.get(f"{BASE_URL}/catalog/artists/3")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert "artist" in data, "Missing 'artist' field"
            artist = data["artist"]
            assert artist.get("name") == "SAVIONCE", f"Expected SAVIONCE, got {artist.get('name')}"
            assert "cashapp" in artist, "Missing 'cashapp' field"
            assert artist["cashapp"], f"Expected non-empty cashapp, got '{artist['cashapp']}'"
            assert "bio" in artist, "Missing 'bio' field"
            assert artist["bio"], f"Expected non-empty bio, got '{artist['bio']}'"
            assert "songs" in data, "Missing 'songs' field"
            print(f"   SAVIONCE: cashapp={artist['cashapp'][:20]}..., bio length={len(artist['bio'])}, songs={len(data['songs'])}")
        self.test("Artist - SAVIONCE (id=3) with cashapp & bio", run)

    def test_genres(self):
        """Test GET /api/catalog/genres"""
        def run():
            r = requests.get(f"{BASE_URL}/catalog/genres")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert "genres" in data, "Missing 'genres' field"
            assert isinstance(data["genres"], list), "genres should be a list"
            assert len(data["genres"]) > 0, "Expected at least one genre"
            print(f"   Found {len(data['genres'])} genres")
        self.test("Genres list", run)

    def test_artists_list(self):
        """Test GET /api/catalog/artists returns 12 artists"""
        def run():
            r = requests.get(f"{BASE_URL}/catalog/artists")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            artists = r.json()
            assert isinstance(artists, list), "Expected artists to be a list"
            assert len(artists) == 12, f"Expected 12 artists, got {len(artists)}"
            print(f"   Found {len(artists)} artists")
        self.test("Artists list - 12 artists", run)

    def test_search(self):
        """Test GET /api/catalog/songs?q=search"""
        def run():
            r = requests.get(f"{BASE_URL}/catalog/songs?q=Shake")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            songs = r.json()
            assert isinstance(songs, list), "Expected songs to be a list"
            assert len(songs) > 0, "Expected at least one result for 'Shake'"
            # Verify search works
            found = any("shake" in song.get("title", "").lower() for song in songs)
            assert found, "Expected to find 'Shake' in search results"
            print(f"   Search 'Shake' returned {len(songs)} results")
        self.test("Search - ?q=Shake", run)

    def test_genre_filter(self):
        """Test GET /api/catalog/songs?genre="""
        def run():
            # First get genres
            r = requests.get(f"{BASE_URL}/catalog/genres")
            genres = r.json()["genres"]
            if len(genres) > 0:
                test_genre = genres[0]
                r = requests.get(f"{BASE_URL}/catalog/songs?genre={test_genre}")
                assert r.status_code == 200, f"Expected 200, got {r.status_code}"
                songs = r.json()
                assert isinstance(songs, list), "Expected songs to be a list"
                # Verify all songs have the genre
                for song in songs:
                    assert song.get("genre", "").lower() == test_genre.lower(), f"Song genre mismatch"
                print(f"   Genre filter '{test_genre}' returned {len(songs)} songs")
        self.test("Genre filter", run)

    def test_favorites_toggle(self):
        """Test POST /api/favorites/toggle"""
        def run():
            # Get a song
            r = requests.get(f"{BASE_URL}/catalog/songs")
            songs = r.json()
            song_id = songs[0]["id"]
            
            # Toggle favorite on
            r = requests.post(f"{BASE_URL}/favorites/toggle", json={"profileId": self.profile_id, "songId": song_id})
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert data.get("favorited") == True, "Expected favorited=True"
            
            # Toggle favorite off
            r = requests.post(f"{BASE_URL}/favorites/toggle", json={"profileId": self.profile_id, "songId": song_id})
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert data.get("favorited") == False, "Expected favorited=False"
            print(f"   Toggled favorite for song {song_id}")
        self.test("Favorites - toggle", run)

    def test_playlists_crud(self):
        """Test playlists CRUD operations"""
        def run():
            # Get a song
            r = requests.get(f"{BASE_URL}/catalog/songs")
            songs = r.json()
            song_id = songs[0]["id"]
            
            # Create playlist
            r = requests.post(f"{BASE_URL}/playlists", json={
                "profileId": self.profile_id,
                "name": "Test Playlist",
                "songIds": [song_id]
            })
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            playlist = r.json()
            assert "id" in playlist, "Missing playlist id"
            self.playlist_id = playlist["id"]
            
            # Get playlists
            r = requests.get(f"{BASE_URL}/playlists/{self.profile_id}")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert "playlists" in data, "Missing playlists field"
            assert len(data["playlists"]) > 0, "Expected at least one playlist"
            
            # Update playlist
            r = requests.patch(f"{BASE_URL}/playlists/{self.playlist_id}", json={"name": "Updated Playlist"})
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            
            # Delete playlist
            r = requests.delete(f"{BASE_URL}/playlists/{self.playlist_id}")
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert data.get("deleted") == True, "Expected deleted=True"
            print(f"   Created, updated, and deleted playlist {self.playlist_id}")
        self.test("Playlists - CRUD operations", run)

    def run_all(self):
        """Run all tests"""
        print("=" * 60)
        print("TREESH 3.0 BACKEND API TESTS")
        print("=" * 60)
        
        # New features
        print("\n📝 NEW FEATURES - LYRICS")
        self.test_lyrics_synced()
        self.test_lyrics_no_lyrics()
        self.test_lyrics_404()
        
        print("\n📝 NEW FEATURES - CATALOG")
        self.test_songs_list()
        self.test_artist_savionce()
        
        # Regression tests
        print("\n🔄 REGRESSION TESTS")
        self.test_genres()
        self.test_artists_list()
        self.test_search()
        self.test_genre_filter()
        self.test_favorites_toggle()
        self.test_playlists_crud()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        print("=" * 60)
        
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    tester = BackendTester()
    sys.exit(tester.run_all())
