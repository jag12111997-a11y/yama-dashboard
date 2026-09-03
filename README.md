# གཤིན་རྗེ — Yama, Lord of Death

Customizable market-intelligence workspace. Single self-contained HTML file — no framework, no server, no build tools required to run.

## Philosophy

> The asset is the subject. The widget is the lens.

Yama is an **observation and research tool**, not a brokerage terminal. 45 widgets across 11 categories let you build your own view of the market.

## Features

- **Drag & drop** widget placement with 20px grid snapping
- **Resize** any widget by dragging corners
- **Lock** widgets in place to prevent accidental moves
- **Fullscreen** any widget with a double-click
- **Multiple layouts** — save, switch, rename, duplicate
- **Export/Import** layouts as JSON
- **Dark theme** — black, blood-red, and cyan palette

## Project Structure

```
yama-dashboard/
├── src/
│   ├── shell.html        # Workspace shell (drag/drop/resize engine)
│   └── gap_widgets.js    # 14 gap-analysis widget render functions
├── data/
│   └── history_data.js   # Embedded JSON market snapshots (39 entries)
├── dist/
│   └── gshinrje.html     # Assembled output — open this in a browser
├── build.py              # Python assembly script
├── .gitignore
└── README.md
```

## Usage

Just open `dist/gshinrje.html` in any modern browser. That's it.

## Building from Source

```bash
python3 build.py
```

This merges the shell, widgets, and data into a single self-contained HTML file.

## Widget Categories

Options & Greeks, Volatility, Market Structure, Flow & Positioning, Momentum & Breadth, Sentiment, Macro, Crypto, Correlation, Risk, and Custom.

## License

Private use.
