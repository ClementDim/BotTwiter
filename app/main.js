import * as dotenv from 'dotenv';
import {getAllFeedsUrl, getFeed} from "./controllers/FeedsController.js";
import {post} from "./controllers/TwitterController.js"

//Setup .ENV environment
dotenv.config();

function main() {
    // Get All Feeds Url
    const feedsUrl = getAllFeedsUrl();
    const checkForNewArticles = async () => {
        console.log('Checking for new articles...');
        Object.keys(feedsUrl).forEach(async (key) => {
            const feed = await getFeed(feedsUrl[key]);
            feed.items.forEach(async (item) => {
                await post(`Nouvel article sur Next.js : "${item.title}" ${item.link}`);
                console.log(`Tweeted: ${item.title}}`);
            });
        });
    };
    checkForNewArticles();
    setInterval(checkForNewArticles, 60 * 1000);
}

main();