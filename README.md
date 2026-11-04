# larprulean.github.io

My personal links page — **[larprulean.github.io](https://larprulean.github.io)**

A single page with my links (GitHub and YouTube) under a hand-drawn, animated "cerulean" wordmark. The colors come from an album cover: dusk violet sky, lavender and off-white.

## What's in here

| File | What it does |
| --- | --- |
| `index.html` | The page itself: title, handle and the list of links |
| `style.css` | Layout, colors, fonts and the scanline/grain texture |
| `wordmark.js` | Draws the 3D tube-letter "CERULEAN" logo in SVG and makes its lines "boil" |
| `favicon.svg` | Browser tab icon |
| `fonts/` | Barlow Condensed and Michroma, self-hosted under the SIL Open Font License |

## Adding a link

Copy one of the `<li>` blocks in `index.html`, then change the `href`, the icon and the name.

## Accessibility

- Text and link rows meet WCAG AA contrast (4.5:1 or better).
- Every link has a visible text name and a clear keyboard focus outline.
- The page scrolls instead of cutting off content when zoomed in.
- The grain and wordmark animations turn off for anyone with "reduce motion" enabled.

## Credits

Fonts: [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) and [Michroma](https://fonts.google.com/specimen/Michroma) (SIL OFL 1.1).
