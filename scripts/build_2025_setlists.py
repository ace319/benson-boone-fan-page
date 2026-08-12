#!/usr/bin/env python3
"""Build the local 2025 show archive from downloaded public setlist.fm pages."""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse


YEAR = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
URLS = Path(f"/tmp/benson-{YEAR}-urls.txt")
PAGES = Path(f"/tmp/benson-{YEAR}-pages")
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / f"benson-{YEAR}-setlists.json"


def text_content(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", value))).strip()


def first(pattern: str, source: str, default: str = "") -> str:
    match = re.search(pattern, source, re.S | re.I)
    return text_content(match.group(1)) if match else default


shows = []
for url in URLS.read_text().splitlines():
    page = PAGES / Path(urlparse(url).path).name
    source = page.read_text(errors="replace")
    month = first(r'<span class="month">(.*?)</span>', source)
    day = first(r'<span class="day">(.*?)</span>', source)
    year = first(r'<span class="year">(.*?)</span>', source, str(YEAR))
    venue = first(r'Venue:.*?<strong>.*?<span>(.*?)</span>', source)
    heading = first(r'<h1[^>]*>(.*?)</h1>', source)
    if not venue and heading.startswith("Benson Boone Setlist "):
        venue = heading.removeprefix("Benson Boone Setlist ").removeprefix("at ")
    event = first(r'<title>Benson Boone Concert Setlist at (.*?) on [A-Z][a-z]+ \d+', source)
    playlist_match = re.search(r'YouTubeSearch\.setPlaylist\((\[.*?\]),\s*(?:true|false)\)', source, re.S)
    playlist = json.loads(playlist_match.group(1)) if playlist_match else []
    sequence = []
    for part in re.finditer(r'<li class="setlistParts ([^"]+)">(.*?)</li>', source, re.S):
        classes, block = part.groups()
        if "song" in classes.split():
            song_match = re.search(r'<a class="songLabel"[^>]*title="Statistics for (.*?) performed by Benson Boone"[^>]*>(.*?)</a>', block, re.S)
            if not song_match:
                continue
            statistics_title, song_title = map(text_content, song_match.groups())
            cover = re.search(r'\(([^()]*) song\)$', statistics_title)
            sequence.append({"type": "song", "title": song_title,
                             "artist": cover.group(1) if cover else "Benson Boone"})
        elif "set" in classes.split() or "encore" in classes.split():
            label = first(r'<span>(.*?)</span>', block)
            if label:
                sequence.append({"type": "set", "label": label.rstrip(":")})
    songs = [{"title": item["title"], "artist": item["artist"]}
             for item in sequence if item["type"] == "song"]
    if not songs:
        songs = [{"title": item.get("song", "").strip(), "artist": item.get("artist", "").strip()}
                 for item in playlist if item.get("song")]
    tour = first(r'<span>Tour:</span>\s*<span>.*?<span>(.*?)</span>', source, "Other performance")
    shows.append({
        "date": f"{month} {day}, {year}",
        "dateSort": f"{year}-{month}-{int(day):02d}" if day else year,
        "venue": venue,
        "event": event if event and event.lower() not in venue.lower() and venue.lower() not in event.lower() else "",
        "title": heading,
        "tour": tour,
        "songs": songs,
        "sequence": sequence,
        "songCount": len(songs),
        "source": url,
    })

month_number = {name: index for index, name in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}
for show in shows:
    parts = show["date"].replace(",", "").split()
    if len(parts) == 3:
        show["dateSort"] = f"{parts[2]}-{month_number.get(parts[0], 0):02d}-{int(parts[1]):02d}"

shows.sort(key=lambda show: show["dateSort"])
OUTPUT.write_text(json.dumps({
    "source": "setlist.fm",
    "year": YEAR,
    "showCount": len(shows),
    "americanHeartCount": sum(show["tour"] == "American Heart" for show in shows),
    "shows": shows,
}, ensure_ascii=False, separators=(",", ":")))
print(f"Wrote {len(shows)} shows to {OUTPUT}")
