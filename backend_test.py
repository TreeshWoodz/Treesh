import requests
import sys
import uuid
from datetime import datetime

class TreeshAPITester:
    def __init__(self, base_url="https://treesh-phase5.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.profile_id = str(uuid.uuid4())
        self.playlist_id = None
        self.test_song_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root(self):
        """Test root endpoint"""
        success, response = self.run_test("Root endpoint", "GET", "", 200)
        return success

    def test_get_all_songs(self):
        """Test getting all songs"""
        success, response = self.run_test("Get all songs", "GET", "catalog/songs", 200)
        if success:
            songs = response if isinstance(response, list) else []
            print(f"   Found {len(songs)} songs")
            if len(songs) > 0:
                self.test_song_id = songs[0].get('id')
                print(f"   First song: {songs[0].get('title')} by {songs[0].get('artist')}")
            if len(songs) != 57:
                print(f"   ⚠️  Expected 57 songs, got {len(songs)}")
        return success

    def test_genre_filter(self):
        """Test genre filter"""
        success, response = self.run_test("Genre filter (rap)", "GET", "catalog/songs", 200, params={"genre": "rap"})
        if success:
            songs = response if isinstance(response, list) else []
            print(f"   Found {len(songs)} rap songs")
        return success

    def test_search(self):
        """Test search functionality"""
        success, response = self.run_test("Search (savionce)", "GET", "catalog/songs", 200, params={"q": "savionce"})
        if success:
            songs = response if isinstance(response, list) else []
            print(f"   Found {len(songs)} songs matching 'savionce'")
        return success

    def test_get_genres(self):
        """Test getting genres"""
        success, response = self.run_test("Get genres", "GET", "catalog/genres", 200)
        if success:
            genres = response.get('genres', [])
            print(f"   Found {len(genres)} genres: {', '.join(genres[:5])}")
        return success

    def test_get_artists(self):
        """Test getting all artists"""
        success, response = self.run_test("Get all artists", "GET", "catalog/artists", 200)
        if success:
            artists = response if isinstance(response, list) else []
            print(f"   Found {len(artists)} artists")
            if len(artists) != 12:
                print(f"   ⚠️  Expected 12 artists, got {len(artists)}")
        return success

    def test_get_artist_detail(self):
        """Test getting artist detail"""
        # Using artist ID 11 as mentioned in requirements
        success, response = self.run_test("Get artist detail (ID: 11)", "GET", "catalog/artists/11", 200)
        if success:
            artist = response.get('artist', {})
            songs = response.get('songs', [])
            print(f"   Artist: {artist.get('name')}")
            print(f"   Songs: {len(songs)}")
        return success

    def test_profile_upsert(self):
        """Test profile upsert"""
        profile_data = {
            "profileId": self.profile_id,
            "nickname": "TestUser",
            "birthday": "1990-01-01",
            "zodiac": "Capricorn",
            "avatar": "avatar1",
            "accent": "#9328ff"
        }
        success, response = self.run_test("Create profile", "POST", "profile", 200, data=profile_data)
        if success:
            print(f"   Profile created: {response.get('nickname')}")
        return success

    def test_get_profile(self):
        """Test getting profile"""
        success, response = self.run_test(f"Get profile", "GET", f"profile/{self.profile_id}", 200)
        if success:
            print(f"   Profile: {response.get('nickname')}")
        return success

    def test_favorites_toggle_add(self):
        """Test adding favorite"""
        if not self.test_song_id:
            print("⚠️  Skipping - no song ID available")
            return False
        
        fav_data = {
            "profileId": self.profile_id,
            "songId": self.test_song_id
        }
        success, response = self.run_test("Add favorite", "POST", "favorites/toggle", 200, data=fav_data)
        if success:
            print(f"   Favorited: {response.get('favorited')}")
        return success

    def test_get_favorites(self):
        """Test getting favorites"""
        success, response = self.run_test("Get favorites", "GET", f"favorites/{self.profile_id}", 200)
        if success:
            songs = response.get('songs', [])
            print(f"   Favorites count: {len(songs)}")
        return success

    def test_favorites_toggle_remove(self):
        """Test removing favorite"""
        if not self.test_song_id:
            print("⚠️  Skipping - no song ID available")
            return False
        
        fav_data = {
            "profileId": self.profile_id,
            "songId": self.test_song_id
        }
        success, response = self.run_test("Remove favorite", "POST", "favorites/toggle", 200, data=fav_data)
        if success:
            print(f"   Favorited: {response.get('favorited')}")
        return success

    def test_create_playlist(self):
        """Test creating playlist"""
        playlist_data = {
            "profileId": self.profile_id,
            "name": "Test Playlist",
            "songIds": []
        }
        success, response = self.run_test("Create playlist", "POST", "playlists", 200, data=playlist_data)
        if success:
            self.playlist_id = response.get('id')
            print(f"   Playlist created: {response.get('name')} (ID: {self.playlist_id})")
        return success

    def test_get_playlists(self):
        """Test getting user playlists"""
        success, response = self.run_test("Get playlists", "GET", f"playlists/{self.profile_id}", 200)
        if success:
            playlists = response.get('playlists', [])
            print(f"   Playlists count: {len(playlists)}")
        return success

    def test_add_song_to_playlist(self):
        """Test adding song to playlist"""
        if not self.playlist_id or not self.test_song_id:
            print("⚠️  Skipping - no playlist or song ID available")
            return False
        
        update_data = {
            "addSongId": self.test_song_id
        }
        success, response = self.run_test("Add song to playlist", "PATCH", f"playlists/{self.playlist_id}", 200, data=update_data)
        if success:
            song_ids = response.get('songIds', [])
            print(f"   Songs in playlist: {len(song_ids)}")
        return success

    def test_get_playlist_detail(self):
        """Test getting playlist detail"""
        if not self.playlist_id:
            print("⚠️  Skipping - no playlist ID available")
            return False
        
        success, response = self.run_test("Get playlist detail", "GET", f"playlists/detail/{self.playlist_id}", 200)
        if success:
            songs = response.get('songs', [])
            print(f"   Playlist: {response.get('name')}, Songs: {len(songs)}")
        return success

    def test_rename_playlist(self):
        """Test renaming playlist"""
        if not self.playlist_id:
            print("⚠️  Skipping - no playlist ID available")
            return False
        
        update_data = {
            "name": "Renamed Test Playlist"
        }
        success, response = self.run_test("Rename playlist", "PATCH", f"playlists/{self.playlist_id}", 200, data=update_data)
        if success:
            print(f"   New name: {response.get('name')}")
        return success

    def test_remove_song_from_playlist(self):
        """Test removing song from playlist"""
        if not self.playlist_id or not self.test_song_id:
            print("⚠️  Skipping - no playlist or song ID available")
            return False
        
        update_data = {
            "removeSongId": self.test_song_id
        }
        success, response = self.run_test("Remove song from playlist", "PATCH", f"playlists/{self.playlist_id}", 200, data=update_data)
        if success:
            song_ids = response.get('songIds', [])
            print(f"   Songs in playlist: {len(song_ids)}")
        return success

    def test_delete_playlist(self):
        """Test deleting playlist"""
        if not self.playlist_id:
            print("⚠️  Skipping - no playlist ID available")
            return False
        
        success, response = self.run_test("Delete playlist", "DELETE", f"playlists/{self.playlist_id}", 200)
        if success:
            print(f"   Deleted: {response.get('deleted')}")
        return success

def main():
    print("=" * 60)
    print("TREESH 3.0 API TEST SUITE")
    print("=" * 60)
    
    tester = TreeshAPITester()

    # Test catalog endpoints
    print("\n" + "=" * 60)
    print("CATALOG ENDPOINTS")
    print("=" * 60)
    tester.test_root()
    tester.test_get_all_songs()
    tester.test_genre_filter()
    tester.test_search()
    tester.test_get_genres()
    tester.test_get_artists()
    tester.test_get_artist_detail()

    # Test profile endpoints
    print("\n" + "=" * 60)
    print("PROFILE ENDPOINTS")
    print("=" * 60)
    tester.test_profile_upsert()
    tester.test_get_profile()

    # Test favorites endpoints
    print("\n" + "=" * 60)
    print("FAVORITES ENDPOINTS")
    print("=" * 60)
    tester.test_favorites_toggle_add()
    tester.test_get_favorites()
    tester.test_favorites_toggle_remove()

    # Test playlists endpoints
    print("\n" + "=" * 60)
    print("PLAYLISTS ENDPOINTS")
    print("=" * 60)
    tester.test_create_playlist()
    tester.test_get_playlists()
    tester.test_add_song_to_playlist()
    tester.test_get_playlist_detail()
    tester.test_rename_playlist()
    tester.test_remove_song_from_playlist()
    tester.test_delete_playlist()

    # Print results
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
