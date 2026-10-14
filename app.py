"""Halloween roulette: spin a wheel with N numbers to pick tonight's movie.

Run: streamlit run app.py
"""
import json
from pathlib import Path

import pandas as pd
import streamlit as st

st.set_page_config(page_title="Halloween Movie Roulette", page_icon="🎃", layout="centered")

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Creepster&display=swap');
    .stApp {
        background: radial-gradient(circle at 50% 0%, #2a0f3d 0%, #0b0610 60%, #000 100%);
    }
    /* Trim Streamlit's default padding so everything fits in the window without scrolling. */
    [data-testid="stMainBlockContainer"] { padding-top: 1rem; padding-bottom: 0; }
    [data-testid="stMainBlockContainer"] [data-testid="stVerticalBlock"] { gap: 0.5rem; }
    h1.spooky {
        font-family: 'Creepster', cursive;
        color: #ff7518;
        text-align: center;
        font-size: clamp(1.8rem, 5vw, 2.7rem);
        letter-spacing: 2px;
        padding: 0.25rem 0 0;
        text-shadow: 0 0 12px #ff7518aa, 0 0 30px #8b00ff66;
        margin-bottom: 0;
    }
    p.sub { text-align: center; color: #c9b6d9; margin: 0 0 0.4rem; }
    </style>
    <h1 class="spooky">🎃 Halloween Movie Roulette 🦇</h1>
    <p class="sub">Spin the cursed wheel to choose tonight's horror movie...</p>
    """,
    unsafe_allow_html=True,
)

here = Path(__file__).parent
MAX_SLICES = 100


@st.cache_data(ttl=300)  # re-read the Google Sheet at most every 5 minutes
def load_movies(source: str) -> pd.DataFrame:
    """Movies from a CSV (local path or the published-to-web CSV URL of a Google Sheet). Needs a `title` column;
    every other column is shown as extra info when the movie wins."""
    # sep=None sniffs "," or ";" (Excel in Spanish saves with ";"); Excel also saves as cp1252 instead of UTF-8.
    try:
        df = pd.read_csv(source, dtype=str, sep=None, engine="python", encoding="utf-8-sig")
    except UnicodeDecodeError:
        df = pd.read_csv(source, dtype=str, sep=None, engine="python", encoding="cp1252")
    df = df.fillna("")
    df.columns = [c.strip().lower() for c in df.columns]
    if "title" not in df.columns:
        raise ValueError(f"no 'title' column (found: {', '.join(df.columns)})")
    df["title"] = df["title"].str.strip()
    return df[df["title"] != ""]


def sheet_csv_url() -> str:
    try:  # local: .streamlit/secrets.toml; Community Cloud: app settings -> Secrets
        return st.secrets.get("movies_sheet_csv", "")
    except Exception:  # no secrets configured at all
        return ""


def movie_items() -> list[dict]:
    sheet_url = sheet_csv_url()
    try:
        df = load_movies(sheet_url or str(here / "movies.csv"))
    except Exception as e:
        if not sheet_url:
            raise
        st.warning(f"Couldn't read the Google Sheet ({e}); using movies.csv instead.")
        df = load_movies(str(here / "movies.csv"))
    if len(df) < 2:
        st.error("The movie list needs at least 2 movies.")
        st.stop()
    if len(df) > MAX_SLICES:
        st.warning(f"{len(df)} movies in the list; the wheel uses the first {MAX_SLICES}.")
        df = df.head(MAX_SLICES)
    extra = [c for c in df.columns if c != "title"]
    return [
        {"label": row["title"], "details": [[c.capitalize(), row[c]] for c in extra if row[c].strip()]}
        for _, row in df.iterrows()
    ]


mode = st.radio("Wheel of...", ["Numbers", "Movies"], horizontal=True, label_visibility="collapsed")
if mode == "Numbers":
    n = st.number_input("How many numbers on the wheel? 👻", min_value=2, max_value=MAX_SLICES, value=10, step=1)
    items = [{"label": str(i), "details": []} for i in range(1, int(n) + 1)]
else:
    items = movie_items()

html = (
    (here / "wheel.html").read_text(encoding="utf-8")
    # "<" escaped so a title like "</script>" from the sheet can't break out of the script tag
    .replace("__ITEMS__", json.dumps(items).replace("<", "\\u003c"))
    .replace("__FX__", (here / "fx.js").read_text(encoding="utf-8"))  # music + ambience, injected into this page
)

st.iframe(html)  # height follows the content; wheel.html sizes the wheel to the window
