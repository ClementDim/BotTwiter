import Twit from 'twit';
import * as fs from "fs";
import axios from "axios";

export const post = async (txt, medias = []) => {
    let T = new Twit({
        consumer_key: process.env.API_KEY,
        consumer_secret: process.env.API_SECRET_KEY,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_SECRET_TOKEN,
        timeout_ms: 60 * 1000,
        strictSSL: true,
    });

    try {
        const media_ids = [];
        if (medias) {
            for (let media of medias) {
                // 1: On encode l'image
                const b64content = fs.readFileSync(media.url, {encoding: 'base64'});
                // 2: On upload l'image
                const media_uploaded = await T.post('media/upload', {media_data: b64content});
                // 3: On Créé les metadata de l'image
                await T.post('media/metadata/create', {
                    media_id: media_uploaded.data.media_id_string,
                    alt_text: {text: media.alt}
                });
                media_ids.push(media_uploaded.data.media_id_string);
            }
        }
        await T.post('statuses/update', {status: txt, media_ids: [media_ids]});
    } catch (err) {
        console.log(err);
    }

    return true;
}

export const verifyCredentials = async () => {
    T.get("account/verify_credentials", {
        include_entities: false,
        skip_status: true,
        include_email: false
    }, err => {
        if (err) throw err;
    });
}
