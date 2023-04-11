import Parser from 'rss-parser';
export const getAllFeedsUrl = () => {
    return {
        'nextjs': 'https://nextjs.org/feed.xml'
    }
}
export const getFeed = async (feedUrl) => {
    const parser = new Parser();
    const feed = await parser.parseURL(feedUrl);
    return feed;
}