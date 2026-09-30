import requests
import sys
import time

class HoopBackendTester:
    def __init__(self, base_url="https://ball-drill-trainer.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = []

    def run_test(self, name, method, endpoint, expected_status, params=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, params=params, headers=headers, timeout=timeout)
            else:
                print(f"❌ Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except ValueError:
                    return success, {}
            else:
                self.tests_failed.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            self.tests_failed.append(f"{name}: Request timed out after {timeout}s")
            print(f"❌ Failed - Request timed out after {timeout}s")
            return False, {}
        except Exception as e:
            self.tests_failed.append(f"{name}: {str(e)}")
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root(self):
        """Test root endpoint"""
        success, response = self.run_test(
            "Root API",
            "GET",
            "api/",
            200
        )
        if success and response.get('app') == 'Hoop by Treesh':
            print(f"   ✓ App name verified: {response.get('app')}")
        return success

    def test_geocode(self, query="Venice Beach Los Angeles"):
        """Test geocode endpoint"""
        success, response = self.run_test(
            f"Geocode '{query}'",
            "GET",
            "api/geocode",
            200,
            params={"q": query, "limit": 5}
        )
        if success:
            results = response.get('results', [])
            print(f"   ✓ Found {len(results)} results")
            if results:
                first = results[0]
                print(f"   ✓ First result: {first.get('name')} at ({first.get('lat')}, {first.get('lon')})")
        return success

    def test_reverse_geocode(self, lat=33.98, lon=-118.4688):
        """Test reverse geocode endpoint"""
        success, response = self.run_test(
            f"Reverse Geocode ({lat}, {lon})",
            "GET",
            "api/reverse",
            200,
            params={"lat": lat, "lon": lon}
        )
        if success:
            print(f"   ✓ Location: {response.get('short', 'N/A')}")
        return success

    def test_courts_venice_beach(self):
        """Test courts endpoint with Venice Beach coordinates (likely cached)"""
        # Venice Beach LA coordinates
        lat, lon = 33.98, -118.4688
        success, response = self.run_test(
            f"Courts near Venice Beach (cached)",
            "GET",
            "api/courts",
            200,
            params={"lat": lat, "lon": lon, "radius": 5000},
            timeout=40  # Allow up to 40s for Overpass
        )
        if success:
            count = response.get('count', 0)
            courts = response.get('courts', [])
            print(f"   ✓ Found {count} courts")
            if courts:
                first = courts[0]
                print(f"   ✓ Nearest: {first.get('name')} ({first.get('distance_m')}m away)")
                print(f"   ✓ Type: {first.get('kind')}, Indoor: {first.get('indoor')}")
        return success

    def test_courts_rucker_park(self):
        """Test courts endpoint with Rucker Park NYC coordinates (likely cached)"""
        # Rucker Park NYC coordinates
        lat, lon = 40.8293, -73.9361
        success, response = self.run_test(
            f"Courts near Rucker Park NYC (cached)",
            "GET",
            "api/courts",
            200,
            params={"lat": lat, "lon": lon, "radius": 5000},
            timeout=40  # Allow up to 40s for Overpass
        )
        if success:
            count = response.get('count', 0)
            courts = response.get('courts', [])
            print(f"   ✓ Found {count} courts")
            if courts:
                first = courts[0]
                print(f"   ✓ Nearest: {first.get('name')} ({first.get('distance_m')}m away)")
        return success

    def test_courts_with_different_radius(self):
        """Test courts endpoint with different radius values"""
        lat, lon = 33.98, -118.4688
        for radius in [1000, 10000]:
            success, response = self.run_test(
                f"Courts with radius {radius}m",
                "GET",
                "api/courts",
                200,
                params={"lat": lat, "lon": lon, "radius": radius},
                timeout=40
            )
            if success:
                count = response.get('count', 0)
                print(f"   ✓ Found {count} courts within {radius}m")

    def test_geocode_edge_cases(self):
        """Test geocode with various queries"""
        queries = [
            "New York",
            "Los Angeles",
            "Chicago"
        ]
        for query in queries:
            success, response = self.run_test(
                f"Geocode '{query}'",
                "GET",
                "api/geocode",
                200,
                params={"q": query, "limit": 3}
            )
            if success:
                results = response.get('results', [])
                print(f"   ✓ Found {len(results)} results")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print(f"📊 BACKEND TEST SUMMARY")
        print("="*60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_failed:
            print("\n❌ Failed tests:")
            for failure in self.tests_failed:
                print(f"   - {failure}")
        else:
            print("\n✅ All tests passed!")
        
        print("="*60)
        return self.tests_passed == self.tests_run

def main():
    print("="*60)
    print("🏀 HOOP BY TREESH - BACKEND API TESTS")
    print("="*60)
    
    tester = HoopBackendTester()
    
    # Test root endpoint
    tester.test_root()
    
    # Test geocoding
    tester.test_geocode("Venice Beach Los Angeles")
    tester.test_geocode("Rucker Park New York")
    
    # Test reverse geocoding
    tester.test_reverse_geocode(33.98, -118.4688)  # Venice Beach
    tester.test_reverse_geocode(40.8293, -73.9361)  # Rucker Park
    
    # Test courts endpoint (cached locations)
    tester.test_courts_venice_beach()
    tester.test_courts_rucker_park()
    
    # Test with different radius
    tester.test_courts_with_different_radius()
    
    # Test edge cases
    tester.test_geocode_edge_cases()
    
    # Print summary
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
