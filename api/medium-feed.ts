export const config = { runtime: 'edge' };

export default async function handler(): Promise<Response> {
  const upstream = await fetch('https://medium.com/feed/@edulacerdaaa', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lacOs/1.0)' }
  });

  if (!upstream.ok) {
    return new Response('Failed to fetch Medium feed', { status: 502 });
  }

  const xml = await upstream.text();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
