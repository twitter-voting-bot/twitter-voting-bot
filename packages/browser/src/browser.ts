import puppeteer from 'puppeteer';
// Taken from here: https://gist.github.com/Brandawg93/728a93e84ed7b66d8dd0af966cb20ecb
// And: https://marian-caikovski.medium.com/automatically-sign-in-with-google-using-puppeteer-cc2cc656da1c
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { GOOGLE_EMAIL, GOOGLE_EMAIL_PASSWORD } from './config';

import type { Browser } from 'puppeteer';

puppeteerExtra.use(StealthPlugin());

export default function browser() {
  let browser: Browser;

  async function initialize(headless = true) {
    if (browser) return browser;
    browser = await puppeteer.launch({
      headless: headless ? 'new' : false,
    });
    return browser;
  }

  async function googleAuth(url: string) {
    const browser = await puppeteerExtra.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url);

    // Add in the e-mail to the input
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', GOOGLE_EMAIL);
    await page.keyboard.press('Enter');

    // Add in the password to the input
    await page.waitForSelector('input[type="password"]');
    await new Promise((r) => setTimeout(r, 2000));
    await page.type('input[type="password"]', GOOGLE_EMAIL_PASSWORD);
    await page.keyboard.press('Enter');

    // Wait redirection and if the page is a warning page, click on the button to continue
    await new Promise((r) => setTimeout(r, 5000));
    if (page.url().includes('oauth/warning')) {
      const buttons = await page.$$('button');
      if (buttons.length >= 3) await buttons[2].click();
    }

    // Approve the consent
    await new Promise((r) => setTimeout(r, 5000));
    if (page.url().includes('consentsummary')) {
      const buttons = await page.$$('button');
      if (buttons.length >= 3) await buttons[2].click();
    }

    await new Promise((r) => setTimeout(r, 3000));

    browser.close();
  }

  return {
    googleAuth,
  };
}
