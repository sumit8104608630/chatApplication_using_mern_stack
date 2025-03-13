import mongoose from 'mongoose';
import {dataBaseName} from "../src/constants.js"


const connectio_to_data_base=async()=>{
try {
    if(!dataBaseName){
        console.log("database name is not defined")
    }
    const connection=mongoose.connect(`${process.env.MONGODB_URL}/${dataBaseName}`);

} catch (error) {
    console.log(error)
}
}

export {connectio_to_data_base}