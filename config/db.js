const mongoose=require('mongoose');
require('dotenv').config;

const redis=require('redis');
const client=redis.createClient();
client.on('error', err => console.log('Redis Client Error', err));

const connection=mongoose.connect(process.env.mongoURL);

module.exports={connection,client}