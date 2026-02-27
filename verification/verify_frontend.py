from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Route Supabase calls to avoid network dependency
        page.route("**/rest/v1/**", lambda route: route.fulfill(
            status=200,
            body='[]',
            headers={'content-type': 'application/json'}
        ))

        # 1. Login Page Branding
        print("Verifying Login Page...")
        page.goto("http://localhost:5173/login")
        # Updated selector based on actual file content
        page.wait_for_selector('h2:has-text("Tutor Intelligence")')
        page.screenshot(path="verification/1_login.png")

        # 2. Register Page Branding
        print("Verifying Register Page...")
        page.goto("http://localhost:5173/register")
        page.wait_for_selector('h2:has-text("SBK Tutor Registration")')
        page.screenshot(path="verification/2_register.png")

        browser.close()
        print("Verification complete. Screenshots saved.")

if __name__ == "__main__":
    verify_frontend()
