// Vercel 서버리스 함수: CNN 공포·탐욕 지수를 서버에서 가져와 반환
// (브라우저 CORS/프록시 문제 없이 안정적으로 동작)
module.exports = async (req, res) => {
  const CNN = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
  try {
    const r = await fetch(CNN, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.cnn.com/markets/fear-and-greed',
        'Origin': 'https://www.cnn.com'
      }
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return res.status(200).json(data.fear_and_greed || {});
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
