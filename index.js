import * as dotenv from 'dotenv';
import Twit from 'twit';
import * as fs from "fs";
import axios from "axios";
import request from "request";
import date from 'date-and-time';

//Setup .ENV environment
dotenv.config();

const T = new Twit({
  consumer_key: process.env.API_KEY,
  consumer_secret: process.env.API_SECRET_KEY,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_SECRET_TOKEN,
  timeout_ms:           60*1000,
  strictSSL:            true,
})

function main() {
  // Twitter Setup
  T.get("account/verify_credentials", {
    include_entities: false,
    skip_status: true,
    include_email: false
  }, err => {
    if (err) throw err;
  });

  postWeatherTweet().then(() => setInterval(postWeatherTweet, 1800000));
}

const post = async (txt, medias = []) => {
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
    await T.post('statuses/update', { status: txt, media_ids: [ media_ids] });

  }catch (err) {
    throw err;
  }

  return true;
}
const postWeatherTweet = async () => {
  const weather = await getWeather();
  await post("Il fait "+weather.temperature+"°C à "+weather.location+", le "+date.format(weather.time, 'DD/MM/YYYY à HH:mm')+" (heure locale)", [weather.medias]);
}
const getWeather = async () => {
  const result = await axios.get('http://api.weatherstack.com/current?access_key=6bed061399fe0f9759c4441b575a71cc&query=Paris',{
    responseType: "json",
  });

  // Téléchargement de l'image
  await download(result.data.current.weather_icons[0], 'weather.jpeg', function(){
    console.log('done');
  });

   return {
    'temperature': result.data.current.temperature,
    'medias': {
        'url': 'weather.jpeg',
        'alt': result.data.current.weather_descriptions[0]
    },
    'time': new Date(result.data.location.localtime),
    'location': result.data.location.name + ' (' + result.data.location.country +')'
  };
}
const download = async (url, dest) => {
  /* Create an empty file where we can save data */
  const file = fs.createWriteStream(dest);
  /* Using Promises so that we can use the ASYNC AWAIT syntax */
  await new Promise((resolve, reject) => {
    request({
      /* Here you should specify the exact link to the file you are trying to download */
      uri: url,
      gzip: true,
    })
      .pipe(file)
      .on('finish', async () => {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  })
    .catch((error) => {
      console.log(`Something happened: ${error}`);
    });
}

main();