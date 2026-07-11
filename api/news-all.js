// Vercel 서버리스: 연합뉴스 증시·경제·산업 RSS를 병합·중복제거·최신순 정렬한 '전체' 피드
module.exports = async (req, res) => {
  const feeds = [
    'https://www.yna.co.kr/rss/market.xml',
    'https://www.yna.co.kr/rss/economy.xml',
    'https://www.yna.co.kr/rss/industry.xml'
  ];
  const pick = (block, tag) => {
    const m = block.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
    return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
  };
  try {
    const all = [];
    await Promise.all(feeds.map(async f => {
      try {
        const r = await fetch(f, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!r.ok) return;
        const xml = await r.text();
        const re = /<item>([\s\S]*?)<\/item>/g;
        let m;
        while ((m = re.exec(xml))) {
          const b = m[1];
          all.push({ title: pick(b, 'title'), link: pick(b, 'link'), date: pick(b, 'pubDate') });
        }
      } catch (e) { /* 개별 피드 실패는 무시 */ }
    }));
    const seen = new Set();
    const uniq = all.filter(it => it.link && !seen.has(it.link) && seen.add(it.link));
    uniq.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=600');
    return res.status(200).json(uniq.slice(0, 25));
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
