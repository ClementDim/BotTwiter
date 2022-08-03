import * as dotenv from 'dotenv';
import fs from "fs";
import request from "request";
import axios from "axios";
import xml2json from 'xml2json';
import Twit from "twit";

//Setup .ENV environment
dotenv.config();

const IDS = [];
let LAST_ETAG, LAST_UPDATE;

const T = new Twit({
  consumer_key: process.env.API_KEY,
  consumer_secret: process.env.API_SECRET_KEY,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_SECRET_TOKEN,
  timeout_ms:           60*1000,
  strictSSL:            true,
})
const getFeed = async (url) => {
  // Set Options
  let options = {
    headers: {
      'Cache-Control': 'no-cache'
    }
  };
  if(LAST_ETAG && LAST_UPDATE){
    options = {
      headers: {
        'If-Modified-Since': 'Tue, 02 Aug 2022 20:40:17 GMT',
        'If-None-Match': '"a12e7f8bd79e95f84e8b99af17a28fe4"'
      }
    };
  }

  // Fetch & returnFeed
  return await axios.get(url, options)
    .then(({status, data, headers})=>{
    console.log('Le feed à été modifié');
    const parsed_feed = JSON.parse(xml2json.toJson(data, {}));
    const items_parsed = [];

    for (let item of parsed_feed.rss.channel.item) {
      if(!IDS.find(val => val === item['post-id'])){
        items_parsed.push({
          'id': item['post-id'],
          'title': item.title,
          'link': item.link,
          'comments': item.comments,
          'creator': item['dc:creator'],
          'tags': item.category,
          'date': item.pubDate,
          'description': item.description
        });
        IDS.push(item['post-id']);
      }
    }

    return {
      'last_modified':  headers['last-modified'],
      'etag':  headers.etag,
      'news': items_parsed
    };
  })
    .catch(({message, response}) => {
    if(response.status === 304)
    {
      console.log('Le feed n\'a pas été modifié');
    }
    else
    {
      console.log(message);
    }
    return false;
  });
}
const tweetItem = async (item) => {
  let text = `Nouvel article : ${item.title} \n\n Par ${item.creator}, le ${item.date} \n\n\n ${item.link} \n\n`
  for(const tag of item.tags){
    text += `#${tag.replace(' ','_')} `;
  }
  await postTweet(text);
}
const postTweet = async (texte, medias = []) => {
  try {
    const media_ids = [];
    if(medias){
      for (let media of medias){
        // 1: On encode l'image
        const b64content = fs.readFileSync(media.url, { encoding: 'base64' });
        // 2: On upload l'image
        const media_uploaded = await T.post('media/upload', { media_data: b64content });
        // 3: On Créé les metadata de l'image
        await T.post('media/metadata/create', { media_id:  media_uploaded.data.media_id_string, alt_text: { text: media.alt } });
        media_ids.push(media_uploaded.data.media_id_string);
      }
    }
    console.log(`Post id ${media_ids}`);
    // 4: On post le tweet
    await T.post('statuses/update', { status: texte, media_ids: [ media_ids] });
  }catch (err) {
    throw err;
  }
  return true;
}

const main = async () => {
  const feed = await getFeed('https://css-tricks.com/feed/');
  if(feed){
    LAST_ETAG = feed.etag;
    LAST_UPDATE = feed.last_modified;
    for(const item of feed.news){
      await tweetItem(item);
    }
    console.log(`Il faut ajouter ${feed.news.length} news !`);
  }
}

(async () => {
  T.get("account/verify_credentials", {
    include_entities: false,
    skip_status: true,
    include_email: false
  }, err => {
    if (err) throw err;
  });

  main().then(() => {
    // Repeat main function each X  millisecondes
    setInterval(async () => {await main()}, 1800000);
  });
})();



