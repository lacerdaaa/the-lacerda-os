import { parseMediumFeed } from './blog.service';

describe('parseMediumFeed', () => {
  it('extracts posts with a plain-text excerpt', () => {
    const xml = `<?xml version="1.0"?>
      <rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
        <item>
          <title>Hello DDD</title>
          <link>https://medium.com/p/1</link>
          <pubDate>Tue, 01 Sep 2026 10:00:00 GMT</pubDate>
          <content:encoded><![CDATA[<p>Bounded <b>contexts</b> everywhere.</p>]]></content:encoded>
        </item>
        <item><title></title><link>https://medium.com/p/2</link></item>
      </channel></rss>`;

    expect(parseMediumFeed(xml)).toEqual([
      { title: 'Hello DDD', link: 'https://medium.com/p/1', pubDate: 'Tue, 01 Sep 2026 10:00:00 GMT', excerpt: 'Bounded contexts everywhere.' }
    ]);
  });
});
