import time
import json
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        headers = {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }

        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info"
        }

        def handle_options(route):
            print(f"Handling OPTIONS: {route.request.url}")
            route.fulfill(status=204, headers=cors_headers)

        def wrap_handler(handler):
            def wrapped(route):
                if route.request.method == "OPTIONS":
                    handle_options(route)
                else:
                    handler(route)
            return wrapped

        # Define mocks
        def handle_user(route):
            print(f"Mocking /user: {route.request.url}")
            route.fulfill(
                status=200,
                headers=headers,
                body='{"id": "user123", "aud": "authenticated", "role": "authenticated", "email": "test@example.com", "user_metadata": {"full_name": "Test User", "role": "tutor"}}'
            )

        def handle_session(route):
            print(f"Mocking /session or /token: {route.request.url}")
            route.fulfill(
                status=200,
                headers=headers,
                body='{"access_token": "dummy", "token_type": "bearer", "expires_in": 3600, "refresh_token": "dummy", "user": {"id": "user123", "aud": "authenticated", "role": "authenticated", "email": "test@example.com", "user_metadata": {"full_name": "Test User", "role": "tutor"}}}'
            )

        def handle_user_profile(route):
            print(f"Mocking /users (profile): {route.request.url}")
            route.fulfill(
                status=200,
                headers=headers,
                body='[{"role": "tutor", "is_active": true, "full_name": "Test User", "id": "user123"}]'
            )

        def handle_sections(route):
            print(f"Mocking /sections: {route.request.url}")
            route.fulfill(
                status=200,
                headers=headers,
                body='[{"id": "sec1", "category_id": "cat1", "section_type": "A", "title": "Math Basics", "order_index": 1}]'
            )

        def handle_questions(route):
            print(f"Mocking /questions: {route.request.url}")
            route.fulfill(
                status=200,
                headers=headers,
                body='[' +
                     '{"id": "q1", "section_id": "sec1", "question_type": "multiple_choice", "question_text": "What is 2+2?", "option_a": "3", "option_b": "4", "option_c": "5", "option_d": "6", "correct_option": "B", "points": 10, "min_word_count": 0},' +
                     '{"id": "q2", "section_id": "sec1", "question_type": "short_answer", "question_text": "Explain why.", "min_word_count": 5, "points": 20},' +
                     '{"id": "q3", "section_id": "sec1", "question_type": "short_answer", "question_text": "Any comments?", "min_word_count": 0, "points": 0}' +
                     ']'
            )

        page.route("**/auth/v1/user", wrap_handler(handle_user))
        page.route("**/auth/v1/token?grant_type=password", wrap_handler(handle_session))
        page.route("**/auth/v1/session", wrap_handler(handle_session))
        page.route("**/rest/v1/users*", wrap_handler(handle_user_profile))
        page.route("**/rest/v1/sections*", wrap_handler(handle_sections))
        page.route("**/rest/v1/questions*", wrap_handler(handle_questions))

        print("Navigating to login...")
        page.goto("http://localhost:3000/login")

        print("Filling login form...")
        page.fill("input[type=email]", "test@example.com")
        page.fill("input[type=password]", "password")
        page.click("button[type=submit]")

        try:
            page.wait_for_url("**/dashboard", timeout=5000)
            print("Logged in successfully.")
        except:
            print("Login navigation timeout.")

        print("Navigating to assessment page...")
        page.goto("http://localhost:3000/assessments/cat1")

        try:
            page.wait_for_selector("text=Math Basics", timeout=10000)
            print("Assessment loaded!")
        except:
            print("Assessment Content load timeout.")
            page.screenshot(path="verification/assessment_fail.png")
            browser.close()
            return

        print("Verifying Header...")
        page.screenshot(path="verification/1_header.png")

        print("Answering Q1...")
        page.click("text=B")

        print("Opening Navigator...")
        page.click("text=Questions")
        time.sleep(1)
        page.screenshot(path="verification/2_navigator_open.png")

        print("Navigating to Q2...")
        page.click("button >> text=2")
        time.sleep(0.5)

        page.screenshot(path="verification/3_q2_initial.png")

        page.fill("textarea", "One two three four five.")
        page.screenshot(path="verification/4_q2_met.png")

        print("Navigating to Q3...")
        page.click("button >> text=3")
        time.sleep(0.5)
        page.screenshot(path="verification/5_q3_no_min.png")

        print("Opening Submit Modal...")
        page.click("text=Submit Assessment")
        time.sleep(0.5)
        page.screenshot(path="verification/6_submit_modal.png")

        browser.close()

if __name__ == "__main__":
    run()
