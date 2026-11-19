"""Builds the Family Storybooks static site.

python3 src/build.py  ->  dist/  (the real site, for GitHub Pages)
Story data lives in assets/js/data.js; this script reads it with node so there is one source of truth.
"""
import json, re, shutil, subprocess
from pathlib import Path
from html import escape as e

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
DOMAIN = "www.familystorybooks.co.uk"
SITE = f"https://{DOMAIN}"

data = json.loads(subprocess.check_output(["node", "-e", """
global.window = {}; require(process.argv[1]); console.log(JSON.stringify(window.FST));
""", str(ROOT / "assets/js/data.js")]))
STORIES, ORDER, CFG, MOTIFS = data["stories"], data["order"], data["config"], data["motifs"]
# A story goes live only once all its painted art is in place (stand-ins, our own characters and 12 example spreads).
for _k, _s in STORIES.items():
    if _s.get("ready") and _s.get("art"):
        _need = [r["key"] for r in _s["roles"]] + ["villain"] + [f"s{n}" for n in range(1, len(_s["pages"]) + 1)]
        _missing = [f for f in _need if not (ROOT / _s["art"] / (f + ".webp")).exists()]
        if _missing:
            _s["ready"] = False
            print(f"{_k}: not live yet, missing {len(_missing)} pictures")
DISCOUNT = CFG["foundingDiscount"]
REGIONS, PRICES, GBP = data["regions"], data["prices"], data["gbp"]


def money(eur):
    """A price shown in pounds by default; region.js switches it to euros for EU visitors."""
    return f'<span class="money" data-eur="{eur}">\u00a3{GBP[str(eur)]}</span>'

FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&family=Oswald:wght@600&display=swap"

LOGO = """<svg class="logo-book" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 8C12 5 6 5 2 6V16C6 15 12 15 16 17.2Z" fill="#EE4B2B"/><path d="M16 8C20 5 26 5 30 6V16C26 15 20 15 16 17.2Z" fill="#FFC21A"/><path d="M2 17.4C6 16.4 12 16.4 16 18.6V28C12 25 6 25 2 26Z" fill="#16A6E3"/><path d="M30 17.4C26 16.4 20 16.4 16 18.6V28C20 25 26 25 30 26Z" fill="#1FB45A"/><path d="M16 8v20" stroke="#1E1A33" stroke-width="1.5"/></svg>"""
FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 8C12 5 6 5 2 6V16C6 15 12 15 16 17.2Z" fill="#EE4B2B"/><path d="M16 8C20 5 26 5 30 6V16C26 15 20 15 16 17.2Z" fill="#FFC21A"/><path d="M2 17.4C6 16.4 12 16.4 16 18.6V28C12 25 6 25 2 26Z" fill="#16A6E3"/><path d="M30 17.4C26 16.4 20 16.4 16 18.6V28C20 25 26 25 30 26Z" fill="#1FB45A"/><path d="M16 8v20" stroke="#1E1A33" stroke-width="1.5"/></svg>"""


def v(rel):
    """Asset link with a short content hash, so browsers fetch a changed file straight away."""
    import hashlib
    h = hashlib.sha1((ROOT / "assets" / rel).read_bytes()).hexdigest()[:8]
    return f"assets/{rel}?v={h}"


def head(title, desc, path):
    return f"""<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}/{path}">
<link rel="canonical" href="{SITE}/{path}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="{v("css/site.css")}">
"""


def header(active=""):
    def a(href, label, key):
        cur = ' aria-current="page"' if key == active else ""
        return f'<a href="{href}"{cur}>{label}</a>'
    return f"""<header class="site-head"><div class="wrap">
<a class="logo" href="index.html" aria-label="Family Storybooks home">{LOGO}Family Storybooks</a>
<nav class="nav" aria-label="Main">{a("index.html#stories", "Stories", "stories")}{a("index.html#how", "How it works", "how")}{a("index.html#pricing", "Pricing", "pricing")}{a("index.html#faq", "FAQ", "faq")}</nav>
<label class="region"><span class="sr-only">Deliver to</span><select class="region-select" aria-label="Deliver to">{''.join(f'<option value="{k}">{e(r["label"])}</option>' for k, r in REGIONS.items())}</select></label>
<a class="acct-link" href="account.html"{' aria-current="page"' if active == "account" else ""}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>My orders</span></a>
<a class="btn btn-sm red" href="index.html#join">Join the list</a>
</div></header>
<p class="region-bar" id="region-bar" role="status" hidden></p>"""


def footer():
    links = "".join(f'<a href="{STORIES[k]["slug"]}.html">{e(STORIES[k]["name"])}</a>' for k in ORDER if STORIES[k].get("ready"))
    return f"""<footer class="site-foot"><div class="wrap foot-grid">
<div style="display:grid;gap:10px;max-width:380px"><a class="logo" href="index.html">{LOGO}Family Storybooks</a>
<p class="small">Classic fairy tales, retold by us, with your family as the characters. Hardcover picture books for ages 3 to 7.</p></div>
<div style="display:grid;gap:12px"><div class="foot-links">{links}<a href="index.html#faq">FAQ</a><a href="index.html#faq-privacy">Photo privacy</a><a href="account.html">My orders</a><a href="mailto:{CFG["email"]}">Contact</a></div>
<div class="foot-links"><a href="{CFG["boardBooks"]}">Family Board Books, for ages 0 to 4</a></div>
<p class="small">&copy; <span data-year>2026</span> Family Storybooks &middot; familystorybooks.co.uk &middot; part of the Family Presents group</p></div>
</div></footer>"""


def page(title, desc, path, body, active="", scripts=()):
    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head(title, desc, path)}</head>
<body>
{header(active)}
<main>
{body}
</main>
{footer()}
<script src="{v("js/data.js")}"></script>
<script src="{v("js/region.js")}"></script>
<script src="{v("js/site.js")}"></script>
{"".join(f'<script src="{v("js/" + x)}"></script>' for x in scripts)}
</body>
</html>
"""


# ---------- Drawings (our own placeholders, never customer photos) ----------
def figure(cape, skin, hair, hood=False, bun=False, cap=False, shawl=False, check=False):
    return ('<svg viewBox="0 0 100 130" aria-hidden="true">'
            f'<path d="M24 126 34 62h32l10 64z" fill="{cape}"/>'
            + (f'<path d="M28 50c0-24 44-24 44 0v16H28z" fill="{cape}"/>' if hood else "")
            + f'<circle cx="50" cy="44" r="16" fill="{skin}"/>'
            + f'<path d="M34 42c2-14 30-14 32 0-6-6-26-6-32 0z" fill="{hair}"/>'
            + (f'<circle cx="50" cy="25" r="7" fill="{hair}"/>' if bun else "")
            + ('<path d="M33 37q17-15 34 0z" fill="#5a4636"/>' if cap else "")
            + '<circle cx="44" cy="46" r="1.8" fill="#1E1A33"/><circle cx="56" cy="46" r="1.8" fill="#1E1A33"/>'
            + '<path d="M45 52q5 4 10 0" stroke="#1E1A33" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
            + ('<path d="M32 64q18 14 36 0l2 8q-20 14-40 0z" fill="#E9E6F2"/>' if shawl else "")
            + ('<path d="M36 72h28M35 84h30M34 96h32M34 108h33M42 64v60M58 64v60" stroke="#fff" stroke-width="2" opacity=".35"/>' if check else "")
            + "</svg>")


CAST_ART = [
    figure("#C8352A", "#F3C9A8", "#7a3b1e", hood=True),
    figure("#1489BD", "#E0AC88", "#3b2a20"),
    figure("#7036B8", "#F1CFB5", "#C9C3D6", bun=True, shawl=True),
    figure("#2E6B4F", "#C98E6A", "#2b1d14", cap=True, check=True),
]

FOREST = """<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<rect width="400" height="500" fill="#DDEFE3"/><circle cx="320" cy="90" r="42" fill="#FFE59A"/>
<path d="M0 300q100-60 200-20t200-30v250H0z" fill="#9CCB8C"/><path d="M0 360q120-40 220 0t180 0v140H0z" fill="#6FAE6A"/>
<g fill="#2E6B4F"><path d="M40 330 80 170l40 160z"/><path d="M300 320l36-140 36 140z"/><path d="M250 340l26-100 26 100z" opacity=".8"/></g>
<path d="M150 500q30-80 90-140" stroke="#E9D9B4" stroke-width="34" fill="none" stroke-linecap="round"/>
<g transform="translate(150 300) scale(1.25)"><path d="M24 126 34 62h32l10 64z" fill="#C8352A"/><path d="M28 50c0-24 44-24 44 0v16H28z" fill="#C8352A"/><circle cx="50" cy="44" r="16" fill="#F3C9A8"/><path d="M34 42c2-14 30-14 32 0-6-6-26-6-32 0z" fill="#7a3b1e"/><circle cx="44" cy="46" r="1.8" fill="#1E1A33"/><circle cx="56" cy="46" r="1.8" fill="#1E1A33"/><path d="M45 52q5 4 10 0" stroke="#1E1A33" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M64 90h22l-3 14H67z" fill="#9A5B34"/></g>
<rect x="300" y="400" width="90" height="26" rx="13" fill="#8a5a3a"/><path d="M296 404q-30-30-10-60 6 24 22 40" fill="#8f8f9a"/>
</svg>"""


# Backdrops for the flip-through preview. The real pages are painted after ordering, from the family's characters.
def _scene(inner, sky="#DDEFE3"):
    return f'<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="1600" height="900" fill="{sky}"/>{inner}</svg>'

TREES = '<g fill="#2E6B4F"><path d="M120 640 220 230l100 410z"/><path d="M1260 620l90-380 90 380z"/><path d="M1030 660l70-270 70 270z" opacity=".75"/><path d="M380 650l60-230 60 230z" opacity=".7"/></g>'
SCENES = {
    "wood": _scene('<circle cx="1320" cy="150" r="80" fill="#FFE59A"/><path d="M0 560q400-120 800-40t800-60v440H0z" fill="#9CCB8C"/><path d="M0 680q500-80 900 0t700 0v220H0z" fill="#6FAE6A"/>' + TREES + '<path d="M620 900q90-200 330-330" stroke="#E9D9B4" stroke-width="90" fill="none" stroke-linecap="round"/><rect x="1120" y="720" width="260" height="60" rx="30" fill="#8a5a3a"/>'),
    "glade": _scene('<circle cx="300" cy="160" r="90" fill="#FFE59A"/><path d="M0 520q400-100 800-20t800-40v440H0z" fill="#B5DA9E"/><path d="M0 660q500-60 900 0t700 0v240H0z" fill="#86C27A"/>' + TREES + '<g fill="#6C7FE0">' + "".join(f'<circle cx="{x}" cy="{y}" r="12"/>' for x, y in [(520,720),(560,760),(610,730),(700,780),(760,740),(820,800),(880,750),(960,790),(1010,730)]) + '</g>'),
    "cottage": _scene('<circle cx="1350" cy="160" r="80" fill="#FFE59A"/><path d="M0 600q500-90 900-20t700-30v350H0z" fill="#8CC47E"/>' + TREES + '<path d="M520 640V420l220-170 220 170v220z" fill="#F4E3C3"/><path d="M490 430l250-200 250 200z" fill="#B5523B"/><rect x="820" y="250" width="40" height="110" fill="#8a5a3a" transform="rotate(8 840 300)"/><rect x="700" y="510" width="80" height="130" rx="40" fill="#8a5a3a"/><rect x="580" y="470" width="80" height="70" rx="8" fill="#BFE3F2"/><rect x="820" y="470" width="80" height="70" rx="8" fill="#BFE3F2"/>'),
    "kitchen": _scene('<rect y="640" width="1600" height="260" fill="#D9B48A"/><rect x="1080" y="140" width="320" height="260" rx="14" fill="#BFE3F2"/><path d="M1080 270h320M1240 140v260" stroke="#fff" stroke-width="10"/><circle cx="1320" cy="210" r="40" fill="#FFE59A"/><rect x="380" y="520" width="700" height="40" rx="10" fill="#9A5B34"/><rect x="420" y="560" width="30" height="180" fill="#9A5B34"/><rect x="1010" y="560" width="30" height="180" fill="#9A5B34"/><path d="M600 520q60-80 120 0z" fill="#E9B44C"/><rect x="760" y="460" width="70" height="60" rx="10" fill="#EE4B2B" opacity=".8"/><g fill="#7a5a3a" opacity=".5"><rect x="120" y="160" width="220" height="16"/><rect x="120" y="300" width="220" height="16"/></g>', "#FBEBD5"),
    "bedroom": _scene('<rect y="660" width="1600" height="240" fill="#C79A74"/><rect x="200" y="120" width="260" height="520" rx="14" fill="#9A5B34"/><path d="M330 120v520" stroke="#7a4426" stroke-width="8"/><circle cx="310" cy="390" r="10" fill="#FFC21A"/><circle cx="350" cy="390" r="10" fill="#FFC21A"/><rect x="760" y="420" width="640" height="260" rx="30" fill="#F2558C" opacity=".75"/><rect x="740" y="330" width="60" height="350" rx="20" fill="#9A5B34"/><rect x="820" y="380" width="180" height="90" rx="40" fill="#fff"/><rect x="1180" y="170" width="220" height="180" rx="12" fill="#BFE3F2"/>', "#F6E6EE"),
    "hill": _scene('<circle cx="1250" cy="170" r="90" fill="#FFE59A"/><path d="M0 700q500-420 1000-80t600-120v400H0z" fill="#8CC47E"/><path d="M0 760q400-80 800 0t800 0v140H0z" fill="#6FAE6A"/><path d="M140 760V600l120-90 120 90v160z" fill="#F4E3C3"/><path d="M120 610l140-110 140 110z" fill="#B5523B"/>', "#D7ECF7"),
}
WOLF = '<svg viewBox="0 0 120 130" aria-hidden="true"><path d="M30 126l8-58h44l8 58z" fill="#8f8f9a"/><path d="M34 34 26 8l22 16zM86 34l8-26-22 16z" fill="#7a7a86"/><ellipse cx="60" cy="50" rx="28" ry="24" fill="#9b9ba6"/><path d="M60 54q-16 0-20 14 20 10 40 0-4-14-20-14z" fill="#E6E2EA"/><circle cx="49" cy="44" r="4" fill="#FFC21A"/><circle cx="71" cy="44" r="4" fill="#FFC21A"/><circle cx="49" cy="44" r="1.6" fill="#1E1A33"/><circle cx="71" cy="44" r="1.6" fill="#1E1A33"/><ellipse cx="60" cy="56" rx="6" ry="4" fill="#1E1A33"/><path d="M42 64q18 12 36 0" stroke="#1E1A33" stroke-width="2.4" fill="#fff"/><path d="M90 110q26-10 22-40" stroke="#8f8f9a" stroke-width="12" fill="none" stroke-linecap="round"/></svg>'


def book_templates():
    t = "".join(f'<template id="cast-{i}">{a}</template>' for i, a in enumerate(CAST_ART))
    t += f'<template id="wolf-art">{WOLF}</template>'
    t += "".join(f'<template id="scene-{k}">{v}</template>' for k, v in SCENES.items())
    return t


def look_inside(k):
    s = STORIES[k]
    names = "".join(f'<label class="field"><span>{e(r["name"])}</span><input type="text" data-name="{r["key"]}" maxlength="24" placeholder="e.g. {e(r["example"])}"></label>' for r in s["roles"])
    return f"""<section id="look-inside" class="section" style="--bc:var(--red);padding-top:24px"><div class="wrap">
<div class="sec-head"><p class="eyebrow">Look inside</p><h2>Flick through the story</h2><p class="lede">Read every page of {e(s["name"])} with your own family's names. The pictures show our own stand-in family; in your book, every page is painted with your family as the characters.</p></div>
<div class="bv" data-book="{k}" tabindex="-1">
<details class="bv-names"><summary>Try it with your names</summary><div class="bv-name-grid">{names}
<label class="field"><span>{e(s["roles"][0]["name"])} is a</span><select data-name="pron"><option value="she">Girl (she)</option><option value="he">Boy (he)</option></select></label>
<label class="field bv-ded-field"><span>Your dedication</span><textarea data-name="dedication" maxlength="160" rows="2" placeholder="e.g. For {e(s["roles"][0]["example"])}, with love from {e(s["roles"][2]["example"])}"></textarea></label></div></details>
<div class="bv-stage" aria-live="polite"></div>
<div class="bv-nav"><button class="arrow bv-prev" type="button" aria-label="Previous page">&larr;</button><p class="bv-count"></p><button class="arrow bv-next" type="button" aria-label="Next page">&rarr;</button></div>
<div class="bv-dots" aria-label="Pages"></div>
</div>
{book_templates()}
</div></section>"""


GUIDE_GOOD = ["A recent photo, in good daylight", "Face to the camera, with the face nice and big (head and shoulders is ideal)", "Eyes clearly visible: no sunglasses, hats pulled low or masks", "Just them in the photo, or tell us who they are in a group photo", "An ordinary phone photo is perfect"]
GUIDE_BAD = ["Blurry, dark or very small photos", "Faces far away, turned sideways or partly hidden", "Heavy filters, stickers or edited faces", "Photos of a screen or a printed photo"]


def maker(k):
    s = STORIES[k]
    good = "".join(f"<li>{e(x)}</li>" for x in GUIDE_GOOD)
    bad = "".join(f"<li>{e(x)}</li>" for x in GUIDE_BAD)
    return f"""<section id="characters" class="section" style="--bc:var(--red);padding-top:0"><div class="wrap">
<div class="sec-head"><p class="eyebrow">Free preview</p><h2>Meet your characters</h2><p class="lede">Add a photo of each person and we'll draw them in costume for the book's opening page, free. Then we paint two story pages with them, so you can see your family in the story. Every other page is painted from these characters after you order. No photo for a part? We'll use our own stand-in character for it, painted in the same style.</p></div>
<div class="mk" data-maker>
<div class="guide">
<div class="guide-col good"><h3>Photos that work best</h3><ul class="ticks">{good}</ul></div>
<div class="guide-col bad"><h3>Try to avoid</h3><ul class="crosses">{bad}</ul></div>
<p class="guide-privacy">Your photos stay private. They're shrunk and stripped of hidden details (such as where they were taken) on your device, kept in encrypted storage in the EU, and never shown to anyone else. If you don't order, they're deleted after 14 days, or you can delete them now.</p>
</div>
<div class="mk-cards"></div>
<label class="check mk-consent"><input type="checkbox" id="mk-consent"><span>I'm the parent or guardian, or I have permission from the people in these photos to use them.</span></label>
<div class="mk-actions"><button type="button" class="btn red mk-go">Draw my characters</button><button type="button" class="btn red mk-scenes" hidden>Paint story pages with my family</button><button type="button" class="btn ghost btn-sm mk-delete">Delete my photos</button><p class="mk-left small"></p></div>
<p class="mk-msg" role="status" aria-live="polite"></p>
</div></div></section>"""


def spread(k="redhood"):
    """A real page from the book, with the example names and its example picture."""
    s = STORIES[k]
    n = s.get("hero", 9)
    pg = s["pages"][n - 1]
    names = {r["key"]: r["example"] for r in s["roles"]}
    pron = {"she": "she", "her": "her"}

    def word(m):
        k = m.group(1)
        if k in pron:
            w = pron[k]
            return w.capitalize() if re.search(r"(^|[.!?…]\s+|“)$", m.string[:m.start()]) else w
        return "<b>" + e(names.get(k, "")) + "</b>"
    fill = lambda t: re.sub(r"\{(\w+)\}", word, e(t, quote=False))
    text = "".join(f"<p>{fill(x)}</p>" for x in pg["text"].split("\n"))
    return f"""<figure class="hero-spread"><div class="bv-page bv-spread side-{pg["side"]}" role="img" aria-label="Spread {n} of {e(s["name"])}: {e(re.sub(r"[{}]", "", pg["pic"]))}">
<div class="bv-pic"><img src="{s["art"]}s{n}.webp" alt=""></div><div class="bv-text">{text}</div></div>
<figcaption class="small">Spread {n} of {e(s["name"])}, with our stand-in family. Yours is painted with your own.</figcaption></figure>"""


def meet(story):
    def art(i, r):
        if story.get("art"):
            return f'<img src="{story["art"]}{r["key"]}.webp" alt="" loading="lazy">'
        return CAST_ART[i % len(CAST_ART)]
    figs = "".join(f'<figure>{art(i, r)}<figcaption>{e(r["name"])}<span>played by {e(r["who"].split(",")[0].split(" or ")[0].replace("Your child", "your child"))}</span></figcaption></figure>' for i, r in enumerate(story["roles"]))
    return f'<div class="meet" role="img" aria-label="Example Meet the characters page"><h3>Meet the characters</h3>{figs}</div>'


def bookcard(k, link=True):
    s = STORIES[k]
    if s.get("ready"):
        return (f'<a class="bookcard b-{s["color"]}" href="{s["slug"]}.html"><div class="motif">{MOTIFS[k]}</div>'
                f'<h3>{e(s["name"])}</h3><p>{e(s["line"])}</p><div class="from"><span>See the story</span><span aria-hidden="true">&rarr;</span></div></a>')
    return (f'<a class="bookcard soon b-{s["color"]}" href="index.html#join" data-soon="{k}" aria-label="{e(s["name"])}, coming soon. Get notified">'
            f'<span class="tag">Coming soon</span><div class="motif">{MOTIFS[k]}</div><h3>{e(s["name"])}</h3><p>{e(s["line"])}</p>'
            '<div class="from"><span>Notify me &rarr;</span></div></a>')


def join_band(selected="redhood"):
    opts = "".join(f'<option value="{k}"{" selected" if k == selected else ""}>{e(STORIES[k]["name"])}{"" if STORIES[k].get("ready") else " (coming soon)"}</option>' for k in ORDER)
    return f"""<section class="section" style="padding-top:0"><div class="wrap">
<div class="band" id="join">
<div style="display:grid;gap:14px"><p class="eyebrow" style="color:#CFCADE">Founding families</p><h2>Be first to order, and get {DISCOUNT}% off</h2><p>Our first storybooks open for orders soon. Join the list and we'll email you a {DISCOUNT}% founding-family discount for your first book.</p></div>
<form class="form" data-signup="waitlist" novalidate>
<div class="field"><label for="w-email" style="color:#fff">Email</label><div class="form-row"><input id="w-email" name="email" type="email" autocomplete="email" placeholder="name@example.com" required><button class="btn red" type="submit">Join the list</button></div></div>
<div class="field"><label for="w-story" style="color:#fff">Which story would you like first?</label><select id="w-story" name="story">{opts}</select></div>
<div class="field"><label for="w-cast" style="color:#fff">Who would star in it? (optional)</label><input id="w-cast" name="cast" type="text" placeholder="For example: Mia, Mum, Grandma and Uncle Joe"></div>
<p class="form-msg" role="status" style="color:#fff"></p>
</form></div></div></section>"""


FAQ = [
    ("How do you put my family in the story?", "You add an ordinary photo of each person and choose who plays which part. We first draw each of them as a story character in costume, in our hand-painted picture-book style. You check and approve these characters, and every page of the book is then drawn from them, so everyone looks the same from the first page to the last."),
    ("What is the “Meet the characters” page?", "The first page of every book introduces the cast: each family member drawn in costume, with their name and the part they play. Children love finding everyone before the story starts."),
    ("Can I see my book before I pay?", "Yes. On each story's page you can flick through every page of the story with your own family's names, and add photos to see your family drawn as characters on the “Meet the characters” page and on two story pages, free. After you order, a private link shows every page, you can ask for any picture to be drawn again, and nothing is printed until you approve it.", "faq-preview"),
    ("Which photos work best?", "A recent, clear photo of each person in good daylight, facing the camera, with their face nice and big. Head and shoulders is ideal, and an ordinary phone photo is perfect. Avoid sunglasses, hats pulled low, heavy filters and faces far away. If someone is in a group photo, just tell us whether they're on the left, right or in the middle.", "faq-photos"),
    ("Does anyone in my family play the baddie?", "Never. Villains such as the Wolf are always our own illustrated characters. Your family always take the good parts: the hero, the helpers and the clever grandparents."),
    ("Are these the Disney versions?", "No. We write our own gentle retellings of the traditional tales, from the Brothers Grimm, Charles Perrault and Hans Christian Andersen, with our own pictures. In our Little Red Riding Hood, nobody gets eaten and Grandma outsmarts the Wolf."),
    ("What age are the books for?", "About 3 to 7. The stories are written to be read aloud, with a rhythm that's fun for grown-ups too. For babies and toddlers, see our sister site Family Board Books."),
    ("What will the book be like?", "A hardcover picture book of about 24 to 32 pages, printed in full colour on quality paper. We'll confirm the exact size, page count and price before ordering opens."),
    ("How much will it cost?", f"Our launch price is \u00a3{GBP[str(PRICES['book']['price'])]} (\u20ac{PRICES['book']['price']}) for a hardcover storybook, and \u00a3{GBP[str(PRICES['copy']['price'])]} (\u20ac{PRICES['copy']['price']}) for each extra copy. We'll confirm prices before ordering opens, and founding families on our list get {DISCOUNT}% off their first book.", "faq-price"),
    ("Where are my photos stored?", "In private, encrypted storage in the European Union, in Cloudflare's EU data centres. Your photos are never sent by email or kept in our shop system. Before a photo leaves your phone or computer, we shrink it and remove hidden details such as where it was taken.", "faq-privacy"),
    ("Who can see my photos?", "Only our automated system. Each book has its own secret key, and nobody on our team looks at your photos unless you ask us for help. To draw the characters, your photos are sent to our AI image provider under business terms that don't allow it to keep them or use them for training. Our printer only receives the finished print file."),
    ("How long do you keep my photos?", "Free previews are deleted after 14 days if you don't order. Original photos are deleted once your book is printed. Pictures and the print file are deleted 30 days after delivery, unless you choose to keep them for reorders. You can delete everything yourself at any time. We never use your photos for advertising or to train AI."),
    ("Where do you deliver?", "The UK and Europe. We'll confirm delivery times when ordering opens."),
]


def faq_html():
    return "".join(f'<details{" id=" + chr(34) + q[2] + chr(34) if len(q) > 2 else ""}><summary>{e(q[0])}</summary><p>{e(q[1])}</p></details>' for q in FAQ)


def pricing(cta_href="#join"):
    b, c, g = PRICES["book"], PRICES["copy"], PRICES["giftbox"]
    return f"""<section id="pricing" class="section" style="--bc:var(--red);padding-top:0"><div class="wrap">
<div class="sec-head"><p class="eyebrow">Pricing</p><h2>Launch prices</h2><p class="lede">One simple price for every story. Founding families on our list get {DISCOUNT}% off their first book.</p></div>
<div class="editions">
<div class="edition featured"><span class="badge">Launch price</span><h3>{e(b["name"])}</h3><p class="muted">{e(b["pages"])}</p><p class="amt">{money(b["price"])}</p><p class="muted">{e(b["detail"])}</p><a class="btn red" href="{cta_href}">Join the list for {DISCOUNT}% off</a></div>
<div class="edition"><h3>{e(c["name"])}</h3><p class="muted">{e(c["pages"])}</p><p class="amt">{money(c["price"])} <small>each</small></p><p class="muted">{e(c["detail"])}</p></div>
</div>
<div class="opts">
<div class="opt"><h3>Free preview</h3><p>Flick through the story and see your family drawn as characters before you pay.</p></div>
<div class="opt"><h3>Gift box +{money(g["price"])}</h3><p>A keepsake box with a ribbon, ready to give.</p></div>
<div class="opt"><h3>Delivery</h3><p>To the UK and Europe. Delivery costs are shown at checkout.</p></div>
</div>
<p class="note">Launch prices. We confirm final prices before ordering opens.</p>
</div></section>"""


# ---------- Home ----------
def home():
    shelf = "".join(bookcard(k) for k in ORDER)
    body = f"""
<section class="hero"><div class="wrap hero-grid split">
<div class="hero-copy">
<h1 class="wordmark">Family Storybooks</h1>
<p class="lede">The classic fairy tales, beautifully retold, with your child and your family as the characters.</p>
<div class="hero-cta"><a class="btn red" href="#join">Join the list for {DISCOUNT}% off</a><a class="btn ghost" href="little-red-riding-hood.html#look-inside">Look inside our first story</a></div>
</div>
{spread()}
</div></section>

<section id="stories" class="shelf-wrap section" style="padding-top:28px" aria-label="Our stories"><div class="wrap">
<div class="shelf-bar"><p class="eyebrow">Our stories</p>
<div class="shelf-arrows"><button class="arrow" id="shelf-prev" type="button" aria-label="Previous stories">&larr;</button><button class="arrow" id="shelf-next" type="button" aria-label="More stories">&rarr;</button></div></div>
<div class="shelf books" id="shelf" tabindex="0" aria-label="Stories, scroll sideways">{shelf}</div>
</div></section>

<section id="how" class="section" style="padding-top:0"><div class="wrap">
<div class="sec-head"><p class="eyebrow">How it works</p><h2>From photos to a storybook</h2></div>
<div class="steps four">
<div class="step"><h3>Choose a story</h3><p>Pick a classic tale. Each one has parts for your child and the people they love.</p></div>
<div class="step"><h3>Cast your family</h3><p>Add a photo of each person and choose who plays Little Red, Grandma, the woodcutter and more.</p></div>
<div class="step"><h3>Meet your characters</h3><p>We draw everyone in costume first. You approve them, and they appear on the book's opening page.</p></div>
<div class="step"><h3>We draw, print and post</h3><p>Every page is drawn from your approved characters, so they look the same throughout. Then we print your hardcover book.</p></div>
</div></div></section>

<section class="section" style="padding-top:0"><div class="wrap split-2">
<div class="sec-head" style="margin:0"><p class="eyebrow">The opening page</p><h2>Meet the characters</h2>
<p class="lede">Every book starts by introducing the cast: your family, drawn in costume, with the part each one plays. These examples show the idea; your book shows your own family.</p></div>
{meet(STORIES["redhood"])}
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<div class="sec-head"><p class="eyebrow">Why families choose us</p><h2>A story they'll ask for every night</h2></div>
<div class="why">
<div class="why-item"><h3>Well told</h3><p>Our own retellings of the classic tales, written to be read aloud, gentle and funny.</p></div>
<div class="why-item"><h3>The whole family</h3><p>Not just your child. Grandparents, parents, aunts and big sisters all get a part.</p></div>
<div class="why-item"><h3>The same on every page</h3><p>Characters are drawn and approved first, so everyone looks like themselves from start to finish.</p></div>
<div class="why-item"><h3>A keepsake</h3><p>A hardcover picture book made to be read again and again, and kept for years.</p></div>
</div></div></section>

{pricing()}

<section id="faq" class="section" style="padding-top:0"><div class="wrap">
<div class="sec-head"><p class="eyebrow">Questions</p><h2>Good to know</h2></div>
<div class="faq">{faq_html()}</div></div></section>

{join_band()}

<section class="section" style="padding-top:0"><div class="wrap"><div class="sister">
<div style="display:grid;gap:6px"><h3>Little one under four?</h3><p>Our sister site makes personalised board books from your family photos: ABC, numbers, colours and more, on thick board pages.</p></div>
<a class="btn ghost" href="{CFG["boardBooks"]}">Visit Family Board Books</a></div></div></section>
"""
    return page("Family Storybooks: personalised fairy tales starring your family",
                "Classic fairy tales retold with your child and family as the characters, drawn from your photos. Hardcover picture books for ages 3 to 7.", "", body, "stories")


# ---------- Story page ----------
def story(k):
    s = STORIES[k]
    roles = "".join(f'<div class="role"><p class="who">{e(r["who"])}</p><h3>{e(r["name"])}</h3><p>{e(r["line"])}</p></div>' for r in s["roles"])
    roles += f'<div class="role villain"><p class="who">Our own character</p><h3>{e(s["villain"]["name"])}</h3><p>{e(s["villain"]["line"])}</p></div>'
    others = "".join(bookcard(o) for o in ORDER if o != k)
    inside = [
        "A “Meet the characters” opening page with your whole cast",
        f"{s['spreads']} illustrated double-page spreads",
        "Your child's name in the story and on the cover",
        "A dedication page with your own message",
        "Hand-painted picture-book style, the same on every page",
        "Hardcover, for ages 3 to 7",
    ]
    body = f"""
<div class="wrap crumbs"><a href="index.html#stories">All stories</a> / {e(s["name"])}</div>
<section class="wrap bhero" style="--bc:var(--red)">
<div class="bhero-copy">
<h1>{e(s["name"])}</h1>
<p class="lede">{e(s["blurb"])}</p>
<div class="bhero-meta"><span class="chip">Ages 3 to 7</span><span class="chip">{s["spreads"]} spreads</span><span class="chip">Hardcover</span><span class="chip">{money(PRICES["book"]["price"])}</span></div>
<div class="hero-cta"><a class="btn red" href="#characters">Meet your characters, free</a><a class="btn ghost" href="#look-inside">Look inside</a></div>
</div>
{spread(k)}
</section>

{look_inside(k)}

<section id="cast" class="section" style="--bc:var(--red);padding-top:24px"><div class="wrap">
<div class="sec-head"><p class="eyebrow">The cast</p><h2>Who plays who?</h2><p class="lede">Any child can play any part, and you choose who's in it. Here's who usually takes each role.</p></div>
<div class="cast">{roles}</div></div></section>

{maker(k)}

<section class="section" style="--bc:var(--red);padding-top:0"><div class="wrap split-2">
<div style="display:grid;gap:18px"><div class="sec-head" style="margin:0"><p class="eyebrow">What's inside</p><h2>Every copy has</h2></div>
<ul class="ticks">{"".join(f"<li>{e(x)}</li>" for x in inside)}</ul></div>
{meet(s)}
</div></section>

{pricing()}

{join_band(k)}

<section class="section" style="padding-top:0"><div class="wrap">
<div class="sec-head"><p class="eyebrow">More stories</p><h2>{"Coming soon" if not any(STORIES[o].get("ready") for o in ORDER if o != k) else "More family stories"}</h2></div>
<div class="shelf books">{others}</div></div></section>
"""
    return page(f"{s['name']}: a personalised storybook starring your family",
                f"{s['name']}, retold with your child and family as the characters. {s['line']}", f"{s['slug']}.html", body, "stories", ("book.js", "maker.js"))


def account():
    body = """<section class="section"><div class="wrap acct-wrap">
<p class="eyebrow">Your account</p>
<h1 class="acct-title">My orders</h1>
<p class="muted">Follow your storybook from order to doorstep, and open your private link to see and approve every page.</p>
<div id="account" class="acct" aria-live="polite" aria-busy="true"><p class="acct-wait">Loading…</p></div>
</div></section>"""
    return page("My orders | Family Storybooks", "Sign in to see your Family Storybooks orders, follow your parcel and approve your pages.", "account.html", body, "account", ("account.js",))


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "assets", DIST / "assets")
    (DIST / "assets/favicon.svg").write_text(FAVICON)
    pages = {"index.html": home(), "account.html": account()}
    for k in ORDER:
        if STORIES[k].get("ready"):
            pages[f"{STORIES[k]['slug']}.html"] = story(k)
    for name, html in pages.items():
        (DIST / name).write_text(html)
    (DIST / "CNAME").write_text(DOMAIN + "\n")
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    urls = "".join(f"<url><loc>{SITE}/{'' if n == 'index.html' else n}</loc></url>" for n in pages)
    (DIST / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    print("built", len(pages), "pages")


if __name__ == "__main__":
    main()
