// StockVista — /api/get-news.js
// Fetches recent news headlines for a company via Google News RSS.
// RSS feeds are explicitly designed for syndication/redistribution — this is
// NOT the same risk category as scraping a site's HTML pages. No fabricated
// sentiment is added here; sentiment classification (if wanted) belongs in
// the AI orchestrator (generate-research.js), clearly separated from raw facts.

function parseRssItems(xml) {
  const items = [];
  const itemBlocks = xml.split('<item>').slice(1);
  for (const block of itemBlocks) {
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      if (!m) return null;
      return m[1].replace('<![CDATA[', '').replace(']]>', '').trim();
    };
    const title = get('title');
    const link = get('link');
    const pubDate = get('pubDate');
    const source = get('source');
    if (title) items.push({ title, link, pubDate, source });
  }
  return items;
}

export default async function handler(req, res) {
  const { company } = req.query || {};
  if (!company) {
    return res.status(400).json({ error: 'company query param is required' });
  }

  try {
    const query = encodeURIComponent(`${company} NSE stock`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockVistaBot/1.0)' } });

    if (!resp.ok) {
      return res.status(502).json({ error: `Upstream request failed (${resp.status})` });
    }

    const xml = await resp.text();
    const items = parseRssItems(xml).slice(0, 10).map(item => ({
      headline: item.title,
      link: item.link,
      publishedAt: item.pubDate,
      source: item.source || 'Google News aggregation',
    }));

    return res.status(200).json({
      company,
      source: 'Google News RSS (aggregated headlines, not a paid news feed)',
      fetchedAt: new Date().toISOString(),
      count: items.length,
      items,
    });
  } catch (err) {
    console.error('get-news error:', err);
    return res.status(500).json({ error: 'Could not fetch news.' });
  }
}
