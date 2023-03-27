const express=require('express');
require('dotenv').config();
const{connection}=require('./config/db');
const{client}=require('./config/db');
const{UserModel}=require('./models/UserModel');
const{CityModel}=require('./models/CityModel');
const{authenticator}=require('./middlewares/authenticator');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app=express();
app.use(express.json());

app.get('/',(req,res)=>{
    res.status(200).send('WELCOME TO WEATHER APP'); 
})

app.post('/signup',async(req,res)=>{
    const {username,email,password}=req.body;
    try {
        const existUser=await UserModel.findOne({email});
        if(existUser){
            res.status(400).send('User already exists!');
        }
        else{
            bcrypt.hash(password,4,async(err,encrypted)=>{
            if(encrypted){
                const user=new UserModel({username,email,password:encrypted});
                await user.save();
                res.status(200).send('User registered successfully..');
            }
            else{
                console.log(err);
                res.status(400).send('Oops! Something went wrong');
            }
            });
        }
    } 
    catch (error) {
        res.status(500).send('something went wrong');
    }
})

app.post('/login',async(req,res)=>{
    const{email,password}=req.body;
    try{
        const user=await UserModel.findOne({email});
        if(user){
            const hashPass=user.password;
            bcrypt.compare(password,hashPass,(err,result)=>{
                if(result){
                    const token=jwt.sign({id:user._id},process.env.key,{expiresIn : 6000});
                    res.status(200).json({"msg": "Sign in successfull..","token":token});
                }
                else{
                    res.status(400).send("Wrong Password entered!!");
                }
            })   
        }
        else{
            res.status(400).send("Wrong E-mail entered!!");
        }
    } 
    catch(error){
        res.status(500).send('Something went wrong!!');
    }
})

app.get('/logout',async(req,res)=>{
    const accessToken=req.headers.authorization;
    try {
        await client.SADD('blackTokens', accessToken);
        res.status(200).send("Logged out successfully..");
    } catch (error) {
        res.status(500).send('Something went wrong!!');
    }
})

// Protected Route
app.get('/weather/:city',authenticator,async(req,res)=>{
    const {city}=req.params;
    const {user}=req.body;
    try{
        const exist= await client.GET(`${city}`);
        if(exist){
            res.status(200).send(exist);
        }
        else{
            const data= await fetch(`http://api.weatherstack.com/current?access_key=1d5521490f3e0139ec281d6d9295636d&query=${city}`);
            const weather= await data.json();

            const prefer=new CityModel({user:user._id,prefered:city});
            await prefer.save();

            await client.SET(`${city}`, weather.current);
            await client.expire(city,1800);

            res.status(200).send(weather.current);
        }
    }catch(error) {
        res.status(500).send('Something went wrong!!');
    }
})

app.listen(process.env.port||3000,async()=>{
    try {
        await connection;
        await client.connect();
        console.log('connected to db');
    } catch (error) {
        console.log(error);
    }
    console.log(`running at port: ${process.env.port||3000}`);
})