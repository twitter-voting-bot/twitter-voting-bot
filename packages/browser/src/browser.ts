import puppeteer from 'puppeteer';
// Taken from here: https://gist.github.com/Brandawg93/728a93e84ed7b66d8dd0af966cb20ecb
// And: https://marian-caikovski.medium.com/automatically-sign-in-with-google-using-puppeteer-cc2cc656da1c
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { sleep } from '@twitter-voting-bot/utils';

import { GOOGLE_EMAIL, GOOGLE_EMAIL_PASSWORD } from './config';
import logger from './logging';

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

  /**
   * This logs the user in on google, it will open puppeteer to login.
   *
   * TODO: Right now it works well for local development, but it will probably require a bit of rework for serverless.
   */
  async function googleAuth(url: string) {
    const googleAuthLog = logger.child('googleAuth');

    googleAuthLog.debug(
      `Starting the browser for google auth, will auth on '${url}'`
    );
    // We can run on stealth mode as well on browserless: https://www.browserless.io/docs/chrome-flags#running-in-stealth
    const browser = await puppeteerExtra.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url);

    googleAuthLog.debug(`Typing in the e-mail to the input and pressing enter`);
    // Add in the e-mail to the input
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', GOOGLE_EMAIL);
    await page.keyboard.press('Enter');

    // Add in the password to the input
    googleAuthLog.debug(
      `Moving to type the password page, needs to wait for 2 seconds.`
    );
    await page.waitForSelector('input[type="password"]');
    await new Promise((r) => setTimeout(r, 2000));
    googleAuthLog.debug(
      `Typing in the password to the input and pressing enter`
    );
    await page.type('input[type="password"]', GOOGLE_EMAIL_PASSWORD);
    await page.keyboard.press('Enter');

    googleAuthLog.debug(
      `Wait 5 seconds for the url redirection, if it is a warning page, click on the button to continue.`
    );
    // Wait redirection and if the page is a warning page, click on the button to continue
    await sleep(5000);
    if (page.url().includes('oauth/warning')) {
      googleAuthLog.debug(`It's a warning button, continuing`);
      const buttons = await page.$$('button');
      if (buttons.length >= 3) await buttons[2].click();
      googleAuthLog.debug(`Wait more 5 seconds for the consent summary page`);
      await sleep(5000);
    }

    // Approve the consent
    if (page.url().includes('consentsummary')) {
      googleAuthLog.debug(`It's the consent summary page, clicking continue`);
      const buttons = await page.$$('button');
      if (buttons.length >= 3) await buttons[2].click();
    }

    googleAuthLog.debug(`Waiting another 3 seconds to finish the auth.`);
    await sleep(3000);

    googleAuthLog.debug(`Closing the browser`);
    browser.close();
  }

  return {
    googleAuth,
  };
}
