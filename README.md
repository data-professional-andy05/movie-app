# 🎃 Halloween Movie Roulette

Streamlit app: pick **Numbers** (2–100 slices) or **Movies** (titles from a list), hit **Spin!**, and the wheel lands on tonight's movie.

## Run

- Double-click `run.bat` (uses the conda env `general_tools_env`), or
- `pip install -r requirements.txt` and then `streamlit run app.py` from this folder.

## Movie list

- Default: `movies.csv` (sample data — replace it with your list). Only `title` is required; any other column
  (year, director, genre, ...) is shown under the title when that movie wins. Max 100 movies on the wheel.
- Optional Google Sheet: same layout (first row = headers). In the sheet, *File > Share > Publish to web* the tab as
  CSV and put that link in the `movies_sheet_csv` secret (see `.streamlit/secrets.toml.example`). It's re-read every
  5 minutes; if it can't be read, the app falls back to `movies.csv` and shows a warning.
  Note: "Publish to web" makes the sheet readable by anyone with the link.

## Deploy (Streamlit Community Cloud)

GitHub Pages only serves static files, so it can't run Streamlit. Use Streamlit Community Cloud (free, deploys from GitHub):

1. Push this folder to a GitHub repo (`.gitignore` keeps `secrets.toml` out).
2. On share.streamlit.io: *Create app* → pick the repo/branch → main file `app.py` (or `halloween-roulette/app.py`
   if the folder isn't the repo root).
3. Optional: *Advanced settings → Secrets* → paste `movies_sheet_csv = "..."`.

## Files

- `app.py` — Streamlit page (title, Numbers/Movies switch, movie loading), embeds the wheel.
- `wheel.html` — the wheel itself (canvas + spin animation + tick sounds + result overlay). Long titles shrink, then get
  cut with "…" on the slices; the overlay shows the full title. The random pick uses the browser's
  `crypto.getRandomValues` (uniform over all slices).
- `fx.js` — music and atmosphere, all generated in the browser (no audio/image files): a music-box waltz with drone, wind, theremin wails, heartbeat + ticks while spinning, a stinger on the result; moonlit sky, graveyard, fog, bats, ghosts, spiders, glowing eyes, lightning that strikes the title, followed by thunder. `wheel.html` injects it once into the Streamlit page so it survives reruns. Browsers only allow sound after a click: use the button at the bottom left (it also mutes). Users with "reduce motion" enabled get a much softer lightning flash.
- `movies.csv` — default movie list.
- `.streamlit/config.toml` — dark/orange theme. `.streamlit/secrets.toml.example` — template for the Google Sheet link.
