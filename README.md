[larprulean.github.io](https://larprulean.github.io)

my personal website :)

## /tracker

[larprulean.github.io/tracker](https://larprulean.github.io/tracker/) is a searchable copy of the [Ye Tracker](https://yetracker.net). Each song has a dropdown with all its versions, and there are tabs for Best Of, Special, Grails and Released.

The data lives in `tracker/data.json`, built by `scripts/scrape_tracker.py`. A GitHub Action re-runs it daily. To refresh by hand:

```
pip install beautifulsoup4
python scripts/scrape_tracker.py
```
