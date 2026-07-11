// Vercel 서버리스: Yahoo Finance에서 지수/시세를 가져와
// 현재값 + 전일 종가 + 전일 대비 등락률을 계산해 JSON으로 반환.
// 요청 예: /api/quotes?symbols=^GSPC,^IXIC,^VIX
module.exports = async (req, res) => {
  const raw = (req.query && req.query.symbols) || '';
  const symbols = String(raw).split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
  if (!symbols.length) return res.status(400).json({ error: 'no symbols' });

  const fetchOne = async (sym) => {
    try {
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/'
        + encodeURIComponent(sym) + '?interval=1d&range=7d';
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) return { symbol: sym, error: 'upstream ' + r.status };
      const result = (await r.json()).chart.result[0];
      const meta = result.meta || {};
      const closes = (result.indicators.quote[0].close || []).filter(x => x != null);
      const last = meta.regularMarketPrice != null ? meta.regularMarketPrice : closes[closes.length - 1];
      const prev = closes.length >= 2 ? closes[closes.length - 2] : meta.chartPreviousClose;
      const change = (last != null && prev != null) ? (last - prev) : null;
      const changePct = (change != null && prev) ? (change / prev * 100) : null;
      return {
        symbol: sym,
        price: last,
        prevClose: prev,
        change,
        changePct,
        currency: meta.currency || ''
      };
    } catch (e) {
      return { symbol: sym, error: String(e) };
    }
  };

  try {
    const out = await Promise.all(symbols.map(fetchOne));
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
