// Vercel 서버리스 함수: 연합뉴스 경제 RSS를 서버에서 가져와 JSON으로 반환
module.exports = async (req, res) => {
  const RSS = 'https://www.yna.co.kr/rss/economy.xml';
  try {
    const r = await fetch(RSS, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    const xml = await r.text();
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    const pick = (block, tag) => {
      const mm = block.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
      return mm ? mm[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    };
    while ((m = re.exec(xml)) && items.length < 15) {
      const b = m[1];
      items.push({ title: pick(b, 'title'), link: pick(b, 'link'), date: pick(b, 'pubDate') });
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return res.status(200).json(items);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
