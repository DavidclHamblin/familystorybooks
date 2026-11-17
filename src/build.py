"""Builds the Family Storybooks static site.

python3 src/build.py  ->  dist/  (the real site, for GitHub Pages)
Story data lives in assets/js/data.js; this script reads it with node so there is one source of truth.
"""
import json, shutil, subprocess
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
DISCOUNT = CFG["foundingDiscount"]

FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&family=Oswald:wght@600&display=swap"

LOGO = """<svg class="logo-book" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 8C12 5 6 5 2 6V16C6 15 12 15 16 17.2Z" fill="#EE4B2B"/><path d="M16 8C20 5 26 5 30 6V16C26 15 20 15 16 17.2Z" fill="#FFC21A"/><path d="M2 17.4C6 16.4 12 16.4 16 18.6V28C12 25 6 25 2 26Z" fill="#16A6E3"/><path d="M30 17.4C26 16.4 20 16.4 16 18.6V28C20 25 26 25 30 26Z" fill="#1FB45A"/><path d="M16 8v20" stroke="#1E1A33" stroke-width="1.5"/></svg>"""
FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 8C12 5 6 5 2 6V16C6 15 12 15 16 17.2Z" fill="#EE4B2B"/><path d="M16 8C20 5 26 5 30 6V16C26 15 20 15 16 17.2Z" fill="#FFC21A"/><path d="M2 17.4C6 16.4 12 16.4 16 18.6V28C12 25 6 25 2 26Z" fill="#16A6E3"/><path d="M30 17.4C26 16.4 20 16.4 16 18.6V28C20 25 26 25 30 26Z" fill="#1FB45A"/><path d="M16 8v20" stroke="#1E1A33" stroke-width="1.5"/></svg>"""


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
<link rel="stylesheet" href="assets/css/site.css">
"""


def header(active=""):
    def a(href, label, key):
        cur = ' aria-current="page"' if key == active else ""
        return f'<a href="{href}"{cur}>{label}</a>'
    return f"""<header class="site-head"><div class="wrap">
<a class="logo" href="index.html" aria-label="Family Storybooks home">{LOGO}Family Storybooks</a>
<nav class="nav" aria-label="Main">{a("index.html#stories", "Stories", "stories")}{a("index.html#how", "How it works", "how")}{a("index.html#faq", "FAQ", "faq")}</nav>
<a class="btn btn-sm red" href="index.html#join">Join the list</a>
</div></header>"""


def footer():
    links = "".join(f'<a href="{STORIES[k]["slug"]}.html">{e(STORIES[k]["name"])}</a>' for k in ORDER if STORIES[k].get("ready"))
    return f"""<footer class="site-foot"><div class="wrap foot-grid">
<div style="display:grid;gap:10px;max-width:380px"><a class="logo" href="index.html">{LOGO}Family Storybooks</a>
<p class="small">Classic fairy tales, retold by us, with your family as the characters. Hardcover picture books for ages 3 to 7.</p></div>
<div style="display:grid;gap:12px"><div class="foot-links">{links}<a href="index.html#faq">FAQ</a><a href="index.html#faq-privacy">Photo privacy</a><a href="mailto:{CFG["email"]}">Contact</a></div>
<div class="foot-links"><a href="{CFG["boardBooks"]}">Family Board Books, for ages 0 to 4</a></div>
<p class="small">&copy; <span data-year>2026</span> Family Storybooks &middot; familystorybooks.co.uk &middot; part of the Family Presents group</p></div>
</div></footer>"""


def page(title, desc, path, body, active=""):
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
<script src="assets/js/data.js"></script>
<script src="assets/js/site.js"></script>
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


def spread():
    s = STORIES["redhood"]
    return f"""<div class="spread" role="img" aria-label="An example page from Little Red Riding Hood">
<div class="leaf"><p class="kicker">Little Red Riding Hood &middot; page 6</p><p class="story-text">{s["sample"]}</p></div>
<div class="leaf art">{FOREST}</div></div>"""


def meet(story):
    figs = "".join(f'<figure>{CAST_ART[i % len(CAST_ART)]}<figcaption>{e(r["name"])}<span>played by {e(r["who"].split(",")[0].split(" or ")[0].replace("Your child", "your child"))}</span></figcaption></figure>' for i, r in enumerate(story["roles"]))
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
    ("Can I see my book before I pay?", "Yes. You'll see your family drawn as characters for free before you order. After you order, a private link shows every page, you can ask for any picture to be drawn again, and nothing is printed until you approve it.", "faq-preview"),
    ("Does anyone in my family play the baddie?", "Never. Villains such as the Wolf are always our own illustrated characters. Your family always take the good parts: the hero, the helpers and the clever grandparents."),
    ("Are these the Disney versions?", "No. We write our own gentle retellings of the traditional tales, from the Brothers Grimm, Charles Perrault and Hans Christian Andersen, with our own pictures. In our Little Red Riding Hood, nobody gets eaten and Grandma outsmarts the Wolf."),
    ("What age are the books for?", "About 3 to 7. The stories are written to be read aloud, with a rhythm that's fun for grown-ups too. For babies and toddlers, see our sister site Family Board Books."),
    ("What will the book be like?", "A hardcover picture book of about 24 to 32 pages, printed in full colour on quality paper. We'll confirm the exact size, page count and price before ordering opens."),
    ("How much will it cost?", f"We'll announce prices when ordering opens. Founding families on our list get {DISCOUNT}% off their first book."),
    ("Where are my photos stored?", "In private, encrypted storage in the European Union, in Cloudflare's EU data centres. Your photos are never sent by email or kept in our shop system. Before a photo leaves your phone or computer, we shrink it and remove hidden details such as where it was taken.", "faq-privacy"),
    ("Who can see my photos?", "Only our automated system. Each book has its own secret key, and nobody on our team looks at your photos unless you ask us for help. To draw the characters, your photos are sent to our AI image provider under business terms that don't allow it to keep them or use them for training. Our printer only receives the finished print file."),
    ("How long do you keep my photos?", "Free previews are deleted after 14 days if you don't order. Original photos are deleted once your book is printed. Pictures and the print file are deleted 30 days after delivery, unless you choose to keep them for reorders. You can delete everything yourself at any time. We never use your photos for advertising or to train AI."),
    ("Where do you deliver?", "The UK and Europe. We'll confirm delivery times when ordering opens."),
]


def faq_html():
    return "".join(f'<details{" id=" + chr(34) + q[2] + chr(34) if len(q) > 2 else ""}><summary>{e(q[0])}</summary><p>{e(q[1])}</p></details>' for q in FAQ)


# ---------- Home ----------
def home():
    shelf = "".join(bookcard(k) for k in ORDER)
    body = f"""
<section class="hero"><div class="wrap hero-grid split">
<div class="hero-copy">
<h1 class="wordmark">Family Storybooks</h1>
<p class="lede">The classic fairy tales, beautifully retold, with your child and your family as the characters.</p>
<div class="hero-cta"><a class="btn red" href="#join">Join the list for {DISCOUNT}% off</a><a class="btn ghost" href="little-red-riding-hood.html">See our first story</a></div>
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
<div class="bhero-meta"><span class="chip">Ages 3 to 7</span><span class="chip">{s["spreads"]} spreads</span><span class="chip">Hardcover</span></div>
<div class="hero-cta"><a class="btn red" href="#join">Join the list for {DISCOUNT}% off</a><a class="btn ghost" href="#cast">See the parts</a></div>
</div>
{spread()}
</section>

<section id="cast" class="section" style="--bc:var(--red);padding-top:24px"><div class="wrap">
<div class="sec-head"><p class="eyebrow">The cast</p><h2>Who plays who?</h2><p class="lede">Any child can play any part, and you choose who's in it. Here's who usually takes each role.</p></div>
<div class="cast">{roles}</div></div></section>

<section class="section" style="--bc:var(--red);padding-top:0"><div class="wrap split-2">
<div style="display:grid;gap:18px"><div class="sec-head" style="margin:0"><p class="eyebrow">What's inside</p><h2>Every copy has</h2></div>
<ul class="ticks">{"".join(f"<li>{e(x)}</li>" for x in inside)}</ul></div>
{meet(s)}
</div></section>

{join_band(k)}

<section class="section" style="padding-top:0"><div class="wrap">
<div class="sec-head"><p class="eyebrow">More stories</p><h2>Coming soon</h2></div>
<div class="shelf books">{others}</div></div></section>
"""
    return page(f"{s['name']}: a personalised storybook starring your family",
                f"{s['name']}, retold with your child and family as the characters. {s['line']}", f"{s['slug']}.html", body, "stories")


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "assets", DIST / "assets")
    (DIST / "assets/favicon.svg").write_text(FAVICON)
    pages = {"index.html": home()}
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
