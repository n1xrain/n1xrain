#!/usr/bin/env python3
"""README başlığındaki animasyonlu terminal kartını (dark + light) üretir.

Kullanım:  python3 assets/hero.py
Renkleri, metinleri veya logoyu değiştirmek için aşağıdaki sabitleri düzenleyin.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent

# 5x7 pixel font — drawn as real rects so the logo never depends on a font being
# installed on the reader's machine (GitHub renders this as a plain <img>).
GLYPHS = {
    "N": ["X...X", "XX..X", "X.X.X", "X.X.X", "X..XX", "X...X", "X...X"],
    "1": ["..X..", ".XX..", "..X..", "..X..", "..X..", "..X..", ".XXX."],
    "X": ["X...X", "X...X", ".X.X.", "..X..", ".X.X.", "X...X", "X...X"],
    "R": ["XXXX.", "X...X", "X...X", "XXXX.", "X.X..", "X..X.", "X...X"],
    "A": ["..X..", ".X.X.", "X...X", "X...X", "XXXXX", "X...X", "X...X"],
    "I": ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
}
WORD = "N1XRAIN"

INFO = [
    ("role",   "Freelance Developer &amp; Designer · Türkiye"),
    ("mobile", "Flutter · Dart · Firebase"),
    ("web",    "Python · Django · PHP · Tailwind"),
    ("live",   "ÖTS+ · Rovero"),
    ("site",   "erdiaydindag.com.tr"),
]

PROMPT = "./ship.sh --dream --code"

THEMES = {
    "dark": dict(
        bg0="#062A2E", bg1="#01090B",
        card_stroke_op="0.9",
        grid="#2A9D8F", grid_op="0.10",
        chrome="#0A363B", chrome_line="#0F4B52",
        title="#83C5BE",
        g1="#83C5BE", g2="#2A9D8F", g3="#E76F51",
        key="#E76F51", val="#BFE3DF", dim="#4E8B88",
        prompt="#2A9D8F", cmd="#DFF4F1", cursor="#E76F51",
        scan="#83C5BE", scan_op="0.55", lines_op="0.05", glow_op="0.55",
    ),
    "light": dict(
        bg0="#FFFFFF", bg1="#DDF0ED",
        card_stroke_op="1",
        grid="#006D77", grid_op="0.09",
        chrome="#E4F3F1", chrome_line="#BFE0DC",
        title="#00575F",
        g1="#006D77", g2="#2A9D8F", g3="#E76F51",
        key="#C75434", val="#124F53", dim="#6C9C98",
        prompt="#006D77", cmd="#0C3F44", cursor="#E76F51",
        scan="#2A9D8F", scan_op="0.22", lines_op="0.04", glow_op="0.30",
    ),
}

W, H = 1200, 360
CELL, GAP = 14, 2                        # pixel pitch / inner gap of the logo grid
ART_X, ART_Y = 54, 104
ART_COLS = len(WORD) * 5 + (len(WORD) - 1)   # 1 blank column between glyphs
ART_W, ART_H = ART_COLS * CELL, 7 * CELL
INFO_X, INFO_Y, INFO_LH = 700, 132, 30


def build(t):
    p = []
    a = p.append

    a(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
      f'viewBox="0 0 {W} {H}" role="img" aria-label="Erdi Aydındağ — Flutter &amp; Firebase Developer">')

    # ---------- defs ----------
    a('<defs>')
    a(f'<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">'
      f'<stop offset="0%" stop-color="{t["bg0"]}"/><stop offset="100%" stop-color="{t["bg1"]}"/></linearGradient>')

    a('<linearGradient id="edge" x1="0%" y1="0%" x2="100%" y2="0%">'
      f'<stop offset="0%" stop-color="{t["g3"]}"><animate attributeName="stop-color" '
      f'values="{t["g3"]};{t["g1"]};{t["g2"]};{t["g3"]}" dur="10s" repeatCount="indefinite"/></stop>'
      f'<stop offset="50%" stop-color="{t["g2"]}"><animate attributeName="stop-color" '
      f'values="{t["g2"]};{t["g3"]};{t["g1"]};{t["g2"]}" dur="10s" repeatCount="indefinite"/></stop>'
      f'<stop offset="100%" stop-color="{t["g1"]}"><animate attributeName="stop-color" '
      f'values="{t["g1"]};{t["g2"]};{t["g3"]};{t["g1"]}" dur="10s" repeatCount="indefinite"/></stop>'
      '</linearGradient>')

    a('<linearGradient id="ascii" x1="0%" y1="0%" x2="100%" y2="100%">'
      f'<stop offset="0%" stop-color="{t["g1"]}"><animate attributeName="stop-color" '
      f'values="{t["g1"]};{t["g2"]};{t["g3"]};{t["g1"]}" dur="9s" repeatCount="indefinite"/></stop>'
      f'<stop offset="100%" stop-color="{t["g2"]}"><animate attributeName="stop-color" '
      f'values="{t["g2"]};{t["g3"]};{t["g1"]};{t["g2"]}" dur="9s" repeatCount="indefinite"/></stop>'
      '</linearGradient>')

    # sweeping shimmer over the ascii art
    a('<linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">'
      '<stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>'
      '<stop offset="50%" stop-color="#ffffff" stop-opacity="0.85"/>'
      '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>'
      '</linearGradient>')

    a('<linearGradient id="scan" x1="0%" y1="0%" x2="0%" y2="100%">'
      f'<stop offset="0%" stop-color="{t["scan"]}" stop-opacity="0"/>'
      f'<stop offset="48%" stop-color="{t["scan"]}" stop-opacity="0.06"/>'
      f'<stop offset="50%" stop-color="{t["scan"]}" stop-opacity="{t["scan_op"]}"/>'
      f'<stop offset="52%" stop-color="{t["scan"]}" stop-opacity="0.06"/>'
      f'<stop offset="100%" stop-color="{t["scan"]}" stop-opacity="0"/>'
      '</linearGradient>')

    a(f'<pattern id="lines" width="4" height="4" patternUnits="userSpaceOnUse">'
      f'<rect width="4" height="1" fill="{t["scan"]}" opacity="{t["lines_op"]}"/></pattern>')

    a(f'<pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">'
      f'<path d="M26 0H0V26" fill="none" stroke="{t["grid"]}" stroke-opacity="{t["grid_op"]}" stroke-width="1"/>'
      f'</pattern>')

    a('<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">'
      '<feGaussianBlur stdDeviation="5" result="b"/>'
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')

    a(f'<clipPath id="card"><rect x="10" y="10" width="{W-20}" height="{H-20}" rx="18"/></clipPath>')

    # typing clip for the prompt line
    a('<clipPath id="typing"><rect x="72" y="286" height="34" width="0">'
      '<animate attributeName="width" values="0;0;260;260;0" keyTimes="0;0.06;0.42;0.94;1" '
      'dur="12s" repeatCount="indefinite"/></rect></clipPath>')

    # shimmer band travelling across the logo
    a(f'<clipPath id="shineclip"><rect y="{ART_Y-6}" height="{ART_H+12}" width="120" x="-160">'
      f'<animate attributeName="x" values="-160;{ART_X+ART_W+40}" dur="6s" repeatCount="indefinite"/>'
      '</rect></clipPath>')
    # left-to-right reveal of the logo, replayed on the 12s loop
    a(f'<clipPath id="wipe"><rect x="{ART_X-4}" y="{ART_Y-6}" height="{ART_H+12}" width="0">'
      f'<animate attributeName="width" values="0;{ART_W+8};{ART_W+8}" keyTimes="0;0.16;1" '
      'dur="12s" repeatCount="indefinite"/></rect></clipPath>')
    a('</defs>')

    # ---------- card ----------
    a('<rect width="100%" height="100%" fill="none"/>')
    a(f'<rect x="10" y="10" width="{W-20}" height="{H-20}" rx="18" fill="url(#bg)"/>')
    a('<g clip-path="url(#card)">')
    a(f'<rect x="10" y="10" width="{W-20}" height="{H-20}" fill="url(#grid)"/>')

    # chrome bar
    a(f'<rect x="10" y="10" width="{W-20}" height="46" fill="{t["chrome"]}" fill-opacity="0.85"/>')
    a(f'<line x1="10" y1="56" x2="{W-10}" y2="56" stroke="{t["chrome_line"]}" stroke-width="1"/>')
    for i, c in enumerate(("#E76F51", "#E9C46A", "#2A9D8F")):
        a(f'<circle cx="{40+i*22}" cy="33" r="6.5" fill="{c}">'
          f'<animate attributeName="opacity" values="1;0.45;1" dur="{3+i}s" repeatCount="indefinite"/></circle>')
    a(f'<text x="{W//2}" y="38" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" '
      f'font-size="14" fill="{t["title"]}" opacity="0.85">erdi@aydindag: ~/profile</text>')

    # ---------- pixel logo ----------
    on, off = [], []
    for gi, ch in enumerate(WORD):
        col0 = gi * 6
        for r, row in enumerate(GLYPHS[ch]):
            for c, px in enumerate(row):
                x = ART_X + (col0 + c) * CELL
                y = ART_Y + r * CELL
                (on if px == "X" else off).append((x, y))

    def cells(coords, fill, extra=""):
        s = CELL - GAP
        return "".join(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="2.5" '
                       f'fill="{fill}"{extra}/>' for x, y in coords)

    # faint "empty contribution" cells behind the word
    a(f'<g opacity="0.18">{cells(off, t["grid"])}</g>')
    a('<g clip-path="url(#wipe)">')
    a(f'<g filter="url(#glow)" opacity="{t["glow_op"]}">{cells(on, "url(#ascii)")}</g>')
    a(f'<g>{cells(on, "url(#ascii)")}</g>')
    a(f'<g clip-path="url(#shineclip)" opacity="0.55">{cells(on, "url(#shine)")}</g>')
    a('</g>')

    a(f'<text x="{ART_X+2}" y="{ART_Y+ART_H+30}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" '
      f'font-size="13" letter-spacing="5.6" fill="{t["dim"]}">ERDİ AYDINDAĞ</text>')

    # ---------- info panel ----------
    mono = 'font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"'
    a(f'<line x1="{INFO_X-32}" y1="86" x2="{INFO_X-32}" y2="{H-46}" stroke="{t["chrome_line"]}" stroke-width="1" opacity="0.7"/>')
    a(f'<text x="{INFO_X}" y="100" {mono} font-size="15" font-weight="600" fill="{t["title"]}">'
      f'<tspan fill="{t["key"]}">▍</tspan> whoami</text>')

    for i, (k, v) in enumerate(INFO):
        y = INFO_Y + i * INFO_LH
        begin = 0.10 + i * 0.055
        a(f'<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" '
          f'keyTimes="0;{begin:.3f};{begin+0.045:.3f};0.94;1" dur="12s" repeatCount="indefinite"/>'
          f'<text x="{INFO_X}" y="{y}" {mono} font-size="14" fill="{t["key"]}">{k:<7}</text>'
          f'<text x="{INFO_X+78}" y="{y}" {mono} font-size="14" fill="{t["val"]}">{v}</text></g>')

    # ---------- prompt ----------
    a(f'<text x="52" y="310" {mono} font-size="17" font-weight="600" fill="{t["prompt"]}">$</text>')
    a(f'<g clip-path="url(#typing)">'
      f'<text x="72" y="310" {mono} font-size="17" fill="{t["cmd"]}">{PROMPT}</text></g>')
    a(f'<rect x="72" y="294" width="10" height="20" fill="{t["cursor"]}">'
      '<animate attributeName="opacity" values="1;1;0;1" dur="1s" repeatCount="indefinite"/>'
      '<animate attributeName="x" values="72;72;322;322;72" keyTimes="0;0.06;0.42;0.94;1" '
      'dur="12s" repeatCount="indefinite"/></rect>')

    # ---------- overlays ----------
    a(f'<rect x="10" y="10" width="{W-20}" height="{H-20}" fill="url(#lines)"/>')
    a(f'<rect x="10" width="{W-20}" height="150" fill="url(#scan)" opacity="0.5">'
      f'<animate attributeName="y" values="-150;{H}" dur="7s" repeatCount="indefinite"/></rect>')
    a('</g>')

    # animated border on top of everything
    a(f'<rect x="10" y="10" width="{W-20}" height="{H-20}" rx="18" fill="none" '
      f'stroke="url(#edge)" stroke-width="2" opacity="{t["card_stroke_op"]}"/>')
    a('</svg>')
    return "\n".join(p)


for name, theme in THEMES.items():
    path = OUT / f"hero-{name}.svg"
    path.write_text(build(theme), encoding="utf-8")
    print(f"wrote {path} ({path.stat().st_size} bytes)")
