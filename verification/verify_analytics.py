from playwright.sync_api import sync_playwright, Page, expect

def test_analytics(page: Page):
    # Mock Supabase Users request
    page.route("**/rest/v1/users*", lambda route: route.fulfill(
        status=200,
        body='[{"id": "u1", "full_name": "Tutor One", "email": "t1@example.com", "role": "tutor"}, {"id": "u2", "full_name": "Tutor Two", "email": "t2@example.com", "role": "tutor"}]',
        headers={"content-type": "application/json"}
    ))

    # Mock Supabase Attempts request
    page.route("**/rest/v1/attempts*", lambda route: route.fulfill(
        status=200,
        body='[{"id": "a1", "user_id": "u1", "category_id": "c1", "score": 80, "percentage": 80, "completed_at": "2023-10-01T10:00:00Z", "status": "graded", "categories": {"name": "Math"}}, {"id": "a2", "user_id": "u1", "category_id": "c1", "score": 90, "percentage": 90, "completed_at": "2023-10-02T10:00:00Z", "status": "graded", "categories": {"name": "Math"}}]',
        headers={"content-type": "application/json"}
    ))

    # Navigate to the test route
    page.goto("http://localhost:5173/test/analytics")

    # Wait for the page to load
    page.wait_for_selector("text=Admin Intelligence", timeout=10000)

    # Verify key metrics are visible (CompactMetricCard)
    expect(page.get_by_role("heading", name="Total Tutors", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="Active Tutors", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="Global Avg", exact=False)).to_be_visible()

    # Verify values (calculated from mock data)
    # 2 Tutors total
    expect(page.get_by_text("2").first).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_analytics(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="error.png")
        finally:
            browser.close()
