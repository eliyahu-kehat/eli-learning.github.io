# Capoeira Squat & Hang Countdown

A dual-countdown web app with Capoeira-inspired styling. Track squat and hang flows against a shared daily roda duration. Keep the tab open and your progress stays in place.

## Features
- Independent squat and hang countdown timers with start/pause and reset controls
- Adjustable daily goal (per timer) with percentage, logged time, and time-left readouts
- 6-minute default target inspired by quick rodas, editable anytime
- In-tab persistence so time is kept while the page remains open

## Running locally
Open `index.html` in your browser. All logic is client-side; no build step is required.

## Make the repo public and publish on GitHub Pages
1. Push this repository to GitHub.
2. In the GitHub repo settings, set **Visibility** to **Public** (or create it as public when first pushing).
3. Under **Settings → Pages**, choose **Deploy from a branch** and select the default branch (e.g., `main`) with the `/ (root)` folder.
4. Save. GitHub will build and serve the site at the provided Pages URL. Changes to the selected branch automatically redeploy.

## Branching model
- `main` now tracks the live Capoeira countdown experience and is the branch to expose via GitHub Pages.
- `work` can continue as a staging or experimentation branch. Merge into `main` whenever you are ready to publish an update.

## Usage
1. Set your desired daily minutes in the goal input (defaults to 6 minutes per movement).
2. Use **Start/Pause** on each timer to let the countdown flow independently.
3. Click **Reset** to refill a timer back to the goal duration. Progress persists as long as the tab stays open.
