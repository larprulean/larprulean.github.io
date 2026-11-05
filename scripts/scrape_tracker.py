"""Pull the Ye Tracker sheet (yetracker.net) into tracker/data.json.

Each song is grouped by era + base title, and every row for that song
(V1, V2, OG, snippet, ...) becomes one entry in its "versions" list.
"""
import json, re, sys, urllib.parse, urllib.request
from datetime import datetime, timezone
from bs4 import BeautifulSoup

BASE = "https://yetracker.net/htmlview/sheet?headers=true&gid="
TABS = {"unreleased": "34972268", "released": "762588265"}
FLAGS = {"⭐": "best", "✨": "special", "🏆": "grail", "🏅": "wanted", "🗑️": "worst", "🗑": "worst", "🤖": "ai"}
FLAG_RE = re.compile("|".join(sorted(map(re.escape, FLAGS), key=len, reverse=True)))
VERSION_RE = re.compile(r"\s*\[([^\]]+)\]\s*")


def fetch(gid):
    req = urllib.request.Request(BASE + gid, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read().decode("utf-8")


def real_url(href):
    if "google.com/url" in href:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get("q")
        if q:
            return q[0]
    return href


def text(td):
    return td.get_text(" ", strip=True).replace(" ", " ") if td else ""


def links(td):
    out = []
    for a in td.find_all("a", href=True):
        u = real_url(a["href"])
        if u not in out:
            out.append(u)
    return out


def split_name(td):
    """Name cell is: title <br> (feat/prod credits) <br> (alt names)."""
    parts = []
    for chunk in td.decode_contents().split("<br"):
        t = BeautifulSoup("<x " + chunk if parts else chunk, "html.parser").get_text(" ", strip=True)
        t = re.sub(r"^x\s*/?>", "", t).strip()
        if t:
            parts.append(t)
    if not parts:
        return "", [], "", ""
    title = parts[0]
    flags = sorted({FLAGS[m] for m in FLAG_RE.findall(title)})
    title = FLAG_RE.sub("", title).replace("️", "").strip()
    tags = VERSION_RE.findall(title)
    base = VERSION_RE.sub(" ", title).strip()
    credits = parts[1] if len(parts) > 1 else ""
    alt = " ".join(parts[2:])
    return base, flags, " ".join(tags), credits, alt


def parse(html, kind):
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.find_all("tr")
    header = None
    eras, songs, index = [], [], {}
    for tr in rows:
        tds = tr.find_all("td")
        if not tds:
            continue
        cells = [text(td) for td in tds]
        if header is None:
            if cells[0] == "Era":
                header = cells
            continue
        if len(tds) < 8 or not cells[1]:
            # era header rows have ~5 cells: stats, era name, timeline, ..., description
            if len(tds) >= 2 and cells[1] and cells[1] not in eras:
                eras.append(re.sub(r"\s*\(.*$", "", cells[1]).strip())
            continue
        era = cells[0]
        if era and era not in eras:
            eras.append(era)
        base, flags, vtag, credits, alt = split_name(tds[1])
        if not base:
            continue
        if kind == "unreleased":
            v = {"tag": vtag, "notes": cells[2], "length": cells[3], "fileDate": cells[4],
                 "leakDate": cells[5], "portion": cells[6], "quality": cells[7]}
            lk = links(tds[8]) if len(tds) > 8 else []
        else:
            v = {"tag": vtag, "notes": cells[2], "length": cells[3], "releaseDate": cells[4],
                 "type": cells[5], "streaming": cells[6]}
            lk = links(tds[7]) if len(tds) > 7 else []
        v["credits"] = credits
        v["flags"] = flags
        v["links"] = lk
        v = {k: val for k, val in v.items() if val not in ("", [], None)}
        # untitled "???" songs are told apart by their alternate names
        key = (era, base.lower(), alt.lower() if base.strip("? ") == "" else "")
        if key not in index:
            index[key] = len(songs)
            songs.append({"era": era, "name": base, "alt": alt, "versions": []})
        s = songs[index[key]]
        if alt and alt not in s["alt"]:
            s["alt"] = (s["alt"] + " " + alt).strip()
        s["versions"].append(v)
    for s in songs:
        fl = sorted({f for v in s["versions"] for f in v.get("flags", [])})
        if fl:
            s["flags"] = fl
        if not s["alt"]:
            del s["alt"]
    return [e for e in eras if e], songs


def main(out):
    data = {"source": "https://yetracker.net", "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}
    for kind, gid in TABS.items():
        eras, songs = parse(fetch(gid), kind)
        used = {s["era"] for s in songs}
        data[kind] = {"eras": [e for e in dict.fromkeys(eras) if e in used] + sorted(used - set(eras)), "songs": songs}
        print(kind, len(songs), "songs", sum(len(s["versions"]) for s in songs), "versions", file=sys.stderr)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "tracker/data.json")
