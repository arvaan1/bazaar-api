const https = require('https');
const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;

const FEEDS = [
  // Mint
  { id:'MINT', name:'Mint',           color:'#145a32', bg:'#d5f5e3', url:'https://www.livemint.com/rss/markets',   topic:'markets'  },
  { id:'MINT', name:'Mint',           color:'#145a32', bg:'#d5f5e3', url:'https://www.livemint.com/rss/economy',   topic:'economy'  },
  { id:'MINT', name:'Mint',           color:'#145a32', bg:'#d5f5e3', url:'https://www.livemint.com/rss/companies', topic:'corporate'},
  { id:'MINT', name:'Mint',           color:'#145a32', bg:'#d5f5e3', url:'https://www.livemint.com/rss/politics',  topic:'policy'   },
  { id:'MINT', name:'Mint',           color:'#145a32', bg:'#d5f5e3', url:'https://www.livemint.com/rss/industry',  topic:'industry' },
  // NDTV Profit
  { id:'NDTV', name:'NDTV Profit',    color:'#c0392b', bg:'#fadbd8', url:'https://feeds.feedburner.com/ndtvprofit-latest', topic:'markets' },
  // Economic Times
  { id:'ET',   name:'Economic Times', color:'#1a5276', bg:'#d6eaf8', url:'https://economictimes.indiatimes.com/markets/rss.cms',                 topic:'markets'  },
  { id:'ET',   name:'Economic Times', color:'#1a5276', bg:'#d6eaf8', url:'https://economictimes.indiatimes.com/news/economy/rss.cms',             topic:'economy'  },
  { id:'ET',   name:'Economic Times', color:'#1a5276', bg:'#d6eaf8', url:'https://economictimes.indiatimes.com/industry/rss.cms',                 topic:'industry' },
  { id:'ET',   name:'Economic Times', color:'#1a5276', bg:'#d6eaf8', url:'https://economictimes.indiatimes.com/industry/banking/finance/rss.cms', topic:'industry' },
  // Moneycontrol
  { id:'MC',   name:'Moneycontrol',   color:'#6c3483', bg:'#e8daef', url:'https://www.moneycontrol.com/rss/latestnews.xml',   topic:'markets'  },
  { id:'MC',   name:'Moneycontrol',   color:'#6c3483', bg:'#e8daef', url:'https://www.moneycontrol.com/rss/business.xml',     topic:'corporate'},
  { id:'MC',   name:'Moneycontrol',   color:'#6c3483', bg:'#e8daef', url:'https://www.moneycontrol.com/rss/marketreports.xml',topic:'markets'  },
  // Financial Times
  { id:'FT',   name:'Financial Times',color:'#7d3c00', bg:'#fdebd0', url:'https://www.ft.com/rss/home/uk',            topic:'global' },
  { id:'FT',   name:'Financial Times',color:'#7d3c00', bg:'#fdebd0', url:'https://www.ft.com/world/asia-pacific/rss', topic:'global' },
  // The Economist
  { id:'ECO',  name:'The Economist',  color:'#1a237e', bg:'#e8eaf6', url:'https://www.economist.com/sections/economics/rss.xml',    topic:'economy'  },
  { id:'ECO',  name:'The Economist',  color:'#1a237e', bg:'#e8eaf6', url:'https://www.economist.com/finance-and-economics/rss.xml', topic:'economy'  },
  { id:'ECO',  name:'The Economist',  color:'#1a237e', bg:'#e8eaf6', url:'https://www.economist.com/sections/business/rss.xml',     topic:'corporate'},
  // CNBC Awaaz
  { id:'CNBC', name:'CNBC Awaaz',     color:'#4a235a', bg:'#f5eef8', url:'https://www.cnbctv18.com/commonfeeds/v1/eng/rss/market.xml',   topic:'markets'  },
  { id:'CNBC', name:'CNBC Awaaz',     color:'#4a235a', bg:'#f5eef8', url:'https://www.cnbctv18.com/commonfeeds/v1/eng/rss/business.xml', topic:'corporate'},
  { id:'CNBC', name:'CNBC Awaaz',     color:'#4a235a', bg:'#f5eef8', url:'https://www.cnbctv18.com/commonfeeds/v1/eng/rss/economy.xml',  topic:'economy'  },
  { id:'CNBC', name:'CNBC Awaaz',     color:'#4a235a', bg:'#f5eef8', url:'https://www.cnbctv18.com/commonfeeds/v1/eng/rss/results.xml',  topic:'corporate'},
  // Money9
  { id:'M9',   name:'Money9',         color:'#0d5c63', bg:'#d0ece7', url:'https://money9.com/feed', topic:'markets' },
];

const BLOCK_KEYWORDS = [
  'cricket','ipl','bcci','test match',' odi ','t20 match','fifa','premier league',
  'formula 1','f1 race','wimbledon','olympics','commonwealth games','asian games',
  'pro kabaddi','nba','nfl','world cup qualifier','match preview','match result',
  'scorecard','batting','bowling','board exam','cbse','icse',' jee ','neet exam',
  'upsc','ssc exam','result declared','admit card','answer key','entrance test',
  'college admission','box office','bollywood','filmfare','oscar','grammy',
];

function isBlocked(title, desc) {
  const text = (title + ' ' + (desc||'')).toLowerCase();
  return BLOCK_KEYWORDS.some(k => text.includes(k));
}

function fetchUrl(urlStr, redirects=0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    try {
      const parsed = new URL(urlStr);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Referer': 'https://www.google.com/',
          'Cache-Control': 'no-cache',
        },
        timeout: 12000,
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, urlStr).href;
          fetchUrl(next, redirects+1).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) return reject(new Error('HTTP '+res.statusCode));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    } catch(e) { reject(e); }
  });
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim().slice(0,280);
}

function getTag(xml, tag) {
  let m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'));
  if (m) return m[1].trim();
  m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (m) return stripHtml(m[1]).trim();
  m = xml.match(new RegExp(`<${tag}[^>]*href="([^"]*)"`, 'i'));
  if (m) return m[1].trim();
  return '';
}

async function parseFeed(feed) {
  try {
    const xml = await fetchUrl(feed.url);
    const parts = xml.split(/<(?:item|entry)[\s>]/i);
    const articles = [];
    for (let i = 1; i < parts.length; i++) {
      const chunk = parts[i];
      const title = getTag(chunk,'title');
      let link = getTag(chunk,'link');
      if (!link) { const m = chunk.match(/<link[^>]+href="([^"]+)"/i); if (m) link = m[1]; }
      const desc = stripHtml(getTag(chunk,'description')||getTag(chunk,'summary')||getTag(chunk,'content'));
      const pub  = getTag(chunk,'pubDate')||getTag(chunk,'published')||getTag(chunk,'updated')||'';
      if (title && link && !isBlocked(title,desc)) {
        articles.push({ id:feed.id+'::'+link, title, link, desc,
          pubDate: pub ? new Date(pub).toISOString() : null,
          sourceId:feed.id, sourceName:feed.name, sourceColor:feed.color, sourceBg:feed.bg, topic:feed.topic });
      }
    }
    return { sourceId:feed.id, articles };
  } catch(e) {
    return { sourceId:feed.id, articles:[], error:e.message };
  }
}

// Cache — refresh every 15 minutes
let cache = { articles:[], sourceCounts:{}, lastUpdated:null };

async function refreshAll() {
  console.log(`[${new Date().toISOString()}] Refreshing feeds...`);
  const results = await Promise.allSettled(FEEDS.map(parseFeed));
  const all = []; const counts = {};
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      const { sourceId, articles } = r.value;
      all.push(...articles);
      counts[sourceId] = (counts[sourceId]||0) + articles.length;
    }
  });
  const seen = new Set();
  const deduped = all.filter(a => { if(seen.has(a.id)) return false; seen.add(a.id); return true; })
    .sort((a,b) => new Date(b.pubDate||0) - new Date(a.pubDate||0));
  cache = { articles:deduped, sourceCounts:counts, lastUpdated:new Date().toISOString() };
  console.log(`  Done — ${deduped.length} articles | ${JSON.stringify(counts)}`);
}

// HTTP server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/api/feeds' || req.url === '/health') {
    const body = req.url === '/health' ? JSON.stringify({ok:true}) : JSON.stringify(cache);
    res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'public, max-age=60'});
    res.end(body);
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Bazaar API running on port ${PORT}`);
  refreshAll();
  setInterval(refreshAll, 15 * 60 * 1000);
});
