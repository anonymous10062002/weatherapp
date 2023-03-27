const mongoose=require('mongoose');

const citySchema= new mongoose.Schema({
    user: String,
    prefered: String
},{versionKey:false})

const CityModel=mongoose.model('cities',citySchema);

module.exports={CityModel}