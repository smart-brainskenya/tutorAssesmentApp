
import { chromium } from 'playwright';

async function verifyLogin() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to Login page...');
    await page.goto('http://localhost:5173/login');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check for specific elements that indicate successful load and branding
    const title = await page.title();
    console.log('Page title:', title);

    // Take a screenshot
    await page.screenshot({ path: 'verification/login_page.png', fullPage: true });
    console.log('Screenshot saved to verification/login_page.png');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
}

verifyLogin();
