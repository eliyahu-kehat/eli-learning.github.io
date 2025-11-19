# Squat & Hang Time Counter

A simple web app with dual stopwatches to track squat and hang time against a daily target. Progress is kept in the open tab so you can pause, resume, or reset without losing your place.

## Features
- Independent squat and hang timers with start/pause and reset controls
- Adjustable daily goal (per timer) with progress bars and percentage display
- In-tab persistence so time is kept while the page remains open

## Running locally
Open `index.html` in your browser. All logic is client-side; no build step is required.

## Make the repo public and publish on GitHub Pages
1. Push this repository to GitHub.
2. In the GitHub repo settings, set **Visibility** to **Public** (or create it as public when first pushing).
3. Under **Settings → Pages**, choose **Deploy from a branch** and select the default branch (e.g., `main`) with the `/ (root)` folder.
4. Save. GitHub will build and serve the site at the provided Pages URL. Changes to the selected branch automatically redeploy.

## Usage
1. Set your desired daily minutes in the goal input.
2. Use **Start/Pause** on each timer to control tracking independently.
3. Click **Reset** to clear a timer. Progress persists as long as the tab stays open.
