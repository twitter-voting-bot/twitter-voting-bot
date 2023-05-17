# twitter-voting-bot

The idea of this repo is to create a twitter bot that will work similar to this: https://www.facebook.com/VersusBot

## Motivation

None, i just wanted to make something fun.

## Installation

I think that just an npm install might work.
We are using npm workspaces you can see that here:
https://docs.npmjs.com/cli/v7/using-npm/workspaces

## What needs to be done

[] **SETUP THE PROJECT**

[] Spike and add Vercel Cron https://vercel.com/docs/cron-jobs to the `cron` package.

[ ] Setup a Github Actions pipeline for CI (and probably CD if that's possible).

[ ] Setup something like Turbopack (https://turbo.build/pack) or any other tool for _blazingly-fast_ builds (if needed, i don't really know)

---

[ ] **CRON**

[ ] Define the cron times (i think one cron job once a day might be sufficient and we do everything that needs to be done this single time)

[ ] Randomly generate a versus battle for the given day.

[ ] Update the results for the previous battle from the previous day.

[ ] (For future) Create a tree of fights for the upcoming days, it will be for the whole week. It'll be like a championship that should end on the last day.

---

[ ] **BROWSER**

[ ] Twitter API is Shit nowadays, so we will be **CHAD** and use a headless browser to update tweets, i hope it can work on serverless environments.

[ ] Yeah, it's just for data fetching (fetch the results), and posting new tweets, nothing exceptionally difficult.

---

[ ] **FORM**

[ ] We will create a formulary, like google forms, the data from the google forms will go for a Google Sheets or to our own database. This is what we will use to create those random fights.

[ ] That's pretty much it.

[ ] Create a google forms

[ ] Create a database (or a Google Sheet that will be used as database)

[ ] Connect to GoogleApis to collect this data.

[ ] Connect to the cron job to fetch these data
