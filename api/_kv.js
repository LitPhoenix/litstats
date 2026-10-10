// Minimal Upstash REST client (variable names found by suffix, READ_ONLY token never used).
const find = (sfx) => Object.keys(process.env).find(k => !k.includes('READ_ONLY') && sfx.some(s => k.endsWith(s)) && process.env[k]);
const urlName = () => find(['REST_API_URL', 'REDIS_REST_URL']);
const tokenName = () => find(['REST_API_TOKEN', 'REDIS_REST_TOKEN']);
const isConfigured = () => !!(urlName() && tokenName());

async function call(path, body) {
  const res = await fetch(process.env[urlName()] + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env[tokenName()]}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json && json.error) || `Redis HTTP ${res.status}`);
  return json;
}
/** Single command. */
async function redis(cmd) { const j = await call('', cmd); if (j.error) throw new Error(j.error); return j.result; }
/** Many commands in one HTTP request. Returns results in order. */
async function pipeline(cmds) {
  if (!cmds.length) return [];
  const arr = await call('/pipeline', cmds);
  return arr.map(r => { if (r.error) throw new Error(r.error); return r.result; });
}
module.exports = { isConfigured, redis, pipeline };