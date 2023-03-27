
const jwt=require('jsonwebtoken');
const{client}=require('../config/db');
const { UserModel } = require('../models/UserModel');
require('dotenv').config();

const authenticator= async(req,res,next)=>{
    const accessToken=req.headers.authorization;
    try {
        const isBlack=await client.SISMEMBER('blackTokens',accessToken);
        if(isBlack){
            res.status(401).send('Please login again! Unauthorized');
        }
        else{
            jwt.verify(accessToken,process.env.key,async(err,decoded)=>{
                if(decoded){
                    const user=await UserModel.findOne({_id:decoded.id});
                    req.body.user=user;
                    next();
                }
                else{
                    console.log(err.message);
                    res.send('Token Expired!!');
                }
            })
        }
    }
    catch(error) {
        res.status(500).send('Something went wrong!');
    }
}

module.exports={authenticator}