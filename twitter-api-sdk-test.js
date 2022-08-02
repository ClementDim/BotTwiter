import {auth, Client} from 'twitter-api-sdk';
import * as dotenv from 'dotenv';

//Setup .ENV environment
dotenv.config();

// Setup Twitter Client with OAuth authentification

const TwitterClient = new Client(new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  scopes: ['tweet.read', 'tweet.write', 'users.read']
}));


const TwitterClientBearer = new Client(process.env.BEARER_TOKEN);

async function main() {

  const { data } = await TwitterClient.users.findUserByUsername('ClemDimanchin');
  await printFollowersOfUser(data.id);

}

async function printFollowersOfUser(user_id) {
  let i = 0;
  const followers = await TwitterClientBearer.users.usersIdFollowers(user_id);
  for(const follower of followers.data) {
    console.log(follower.name)
  }
}

main().then();