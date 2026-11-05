"""Normalises data/source-products.json -> src/data/products.json (light index), public/data/p/<slug>.json (detail)
and public/data/merchant-feed.tsv.  Run: python _tools/prepare_data.py   (after _tools/fetch_images.py)
Scope: everything except Dresses. Discontinued variants are dropped (ads must not point at unavailable items)."""
import json, re, os, html, csv
from collections import OrderedDict, Counter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
cfg = json.load(open(os.path.join(ROOT, 'site.config.json'), encoding='utf8'))
src = json.load(open(os.path.join(ROOT, 'data', 'source-products.json'), encoding='utf8'))
IMGDIR = os.path.join(ROOT, 'public', 'img', 'p'); DOMAIN = cfg['domain'].rstrip('/')
CATS = ['shoes', 'leotards', 'tops', 'bottoms', 'tights', 'accessories']
SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']; GROUP_ORDER = {'Child': 0, 'Adult': 1, 'Plus': 2}
def slugify(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def infer_cat(name):
    n = name.lower()
    if re.search(r'shoe|sneaker|slipper|boot|pointe', n): return 'shoes', ''
    if re.search(r'leotard|unitard|biketard', n): return 'leotards', ''
    if re.search(r'tight', n): return 'tights', ''
    if re.search(r'short|pant|legging|jogger|skirt|tutu', n): return 'bottoms', ''
    return 'tops', ''
def catmap(x):
    parts = [p.strip() for p in x['category_path'].split('>')]; c = parts[0]; s = parts[1] if len(parts) > 1 else ''
    if c == 'dresses': return None
    if c in ('kids', 'new arrivals'): c, s = (s, '') if s in CATS else infer_cat(x['name'])
    elif c == 'gymnastics': c, s = 'leotards', 'unitards'
    elif c not in CATS: c, s = infer_cat(x['name'])
    return c, s
def size_key(sz, grp):
    m = re.match(r'^(\d+(?:\.\d+)?)', sz or '')
    if m: return (GROUP_ORDER.get(grp, 9), 0, float(m.group(1)), sz)
    core = re.sub(r'[CAP]$', '', sz or ''); return (GROUP_ORDER.get(grp, 9), 1, SIZE_ORDER.index(core) if core in SIZE_ORDER else 50, sz)
def parse_desc(h):
    bullets, details, country = [], [], ''
    m = re.search(r'<ul class="country-ul">(.*?)</ul>', h, re.S)
    if m: country = re.sub(r'<[^>]+>', ' ', m.group(1)).strip(); h = h.replace(m.group(0), '')
    for li in re.findall(r'<li>(.*?)</li>', h, re.S):
        t = html.unescape(re.sub(r'<[^>]+>', '', li)).strip()
        if t: bullets.append(t)
    for k, v in re.findall(r'<strong>\s*(.*?)\s*:?\s*</strong>\s*:?\s*(.*?)</p>', h, re.S):
        k = html.unescape(re.sub(r'<[^>]+>', '', k)).strip(' :'); v = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', v))).strip(' ,')
        if k and v: details.append([k, v])
    return bullets, details, country
PR = cfg.get('pricing', {})
def markup_pct(sku, base_min):
    if not PR.get('enabled'): return 0
    if sku in PR.get('overrides', {}): return PR['overrides'][sku]
    for t in PR.get('tiers', []):
        if 'under' not in t or base_min < t['under']: return t['markupPercent']
    return 0
def new_price(price, pct):
    if not pct: return round(price, 2)
    raw = price * (1 + pct / 100.0); end = PR.get('endWith')
    if end is None: return round(raw, 2)
    whole = int(raw)
    cands = [whole - 1 + end, whole + end, whole + 1 + end]
    return round(min(c for c in cands if c >= raw - 1e-9), 2)  # round up so the markup is never below the target
def exists(f): return os.path.exists(os.path.join(IMGDIR, f))

P = []; skipped_noimg = 0
for x in src:
    if not x.get('name'): continue
    live = [v for v in x['variants'] if v['stock'] == 'InStock' and v['price']]
    cm = catmap(x)
    if not live or not cm: continue
    cat, sub = cm; have = set(x['images']); base = x['slug']
    colors = list(OrderedDict.fromkeys(v['color'] for v in live))
    cimgs = {}
    for c in colors:
        f = f"{base}_{re.sub(r'[^a-z0-9]+', '_', c.lower()).strip('_')}.webp"
        if f[:-5] + '.jpg' in have and exists(f): cimgs[c] = f
    main = base + '.webp' if exists(base + '.webp') else next(iter(cimgs.values()), None)
    if not main: skipped_noimg += 1; continue
    extras = [i[:-4] + '.webp' for i in sorted(have) if (i[:-4] == base or i.startswith(base + '_')) and exists(i[:-4] + '.webp')]
    bullets, details, country = parse_desc(x['desc_html'])
    if not bullets and x['desc_text']: bullets = [x['desc_text']]
    sizes = sorted({(v['size'], v['group']) for v in live}, key=lambda t: size_key(*t))
    base_min = min(float(v['price']) for v in live); pct = markup_pct(x['sku'], base_min)
    for v in live: v['price'] = new_price(float(v['price']), pct)
    prices = [float(v['price']) for v in live]
    P.append(dict(slug=slugify(x['name']) + '-' + slugify(x['sku']), sku=x['sku'], name=x['name'], brand=x['brand'], cat=cat, sub=sub, pmin=min(prices), pmax=max(prices),
                  main=main, colors=colors, _pct=pct, _orig=base_min, groups=sorted({g for _, g in sizes}, key=lambda g: GROUP_ORDER.get(g, 9)),
                  bullets=bullets, details=details, country=country, material=x.get('material', ''), cimgs=cimgs, extras=extras, sizes=[list(s) for s in sizes],
                  variants=[dict(k=v['sku'], c=v['color'], s=v['size'], g=v['group'], p=float(v['price'])) for v in live]))
P.sort(key=lambda p: (CATS.index(p['cat']), p['sub'], -len(p['colors']), p['name']))
from collections import Counter as _C
print('markup applied:', dict(_C(p['_pct'] for p in P)), '| avg increase: %.1f%%' % (sum(p['pmin'] / p['_orig'] - 1 for p in P) / len(P) * 100))
LIGHT = ['slug', 'sku', 'name', 'brand', 'cat', 'sub', 'pmin', 'pmax', 'main', 'colors', 'groups']
os.makedirs(os.path.join(ROOT, 'src', 'data'), exist_ok=True)
json.dump([{k: p[k] for k in LIGHT} for p in P], open(os.path.join(ROOT, 'src', 'data', 'products.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
pdir = os.path.join(ROOT, 'public', 'data', 'p'); os.makedirs(pdir, exist_ok=True)
for f in os.listdir(pdir): os.remove(os.path.join(pdir, f))
for p in P: json.dump({k: v for k, v in p.items() if not k.startswith('_')}, open(os.path.join(pdir, p['slug'] + '.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
with open(os.path.join(ROOT, 'public', 'data', 'merchant-feed.tsv'), 'w', encoding='utf8', newline='') as f:
    w = csv.writer(f, delimiter='\t')
    w.writerow(['id', 'item_group_id', 'title', 'description', 'link', 'image_link', 'price', 'availability', 'condition', 'brand', 'product_type', 'color', 'size', 'age_group', 'mpn'])
    for p in P:
        for v in p['variants']:
            w.writerow([v['k'], p['sku'], f'{p["name"]} - {v["c"]} / {v["s"]}', ' '.join(p['bullets'])[:4900] or p['name'], f'{DOMAIN}/p/{p["slug"]}?variant={v["k"]}',
                        f'{DOMAIN}/img/p/{p["cimgs"].get(v["c"]) or p["main"]}', f'{v["p"]:.2f} {cfg["currency"]}', 'in_stock', 'new', p['brand'], p['cat'] + (' > ' + p['sub'] if p['sub'] else ''), v['c'], v['s'], 'kids' if v['g'] == 'Child' else 'adult', p['sku']])
used = set()
for p in P: used.add(p['main']); used.update(p['cimgs'].values()); used.update(p['extras'])
pruned = 0
for f in os.listdir(IMGDIR):
    if f not in used: os.remove(os.path.join(IMGDIR, f)); pruned += 1
print('pruned unused images:', pruned)
print('products', len(P), dict(Counter(p['cat'] for p in P)), '| skipped (no photo):', skipped_noimg, '| variants', sum(len(p['variants']) for p in P))
