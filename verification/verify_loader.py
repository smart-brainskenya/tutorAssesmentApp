import re
from playwright.sync_api import sync_playwright, expect

def test_login_and_verify_branding():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        print("Navigating to login page...")
        page.goto("http://localhost:3000/login")

        # Check for SBK branding elements
        logo = page.locator("img[src='/assets/logo.png']")
        expect(logo).to_be_visible()

        page.screenshot(path="verification/1_login.png")
        print("Login page screenshot captured.")

        browser.close()

if __name__ == "__main__":
    test_login_and_verify_branding()
