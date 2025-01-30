import "dotenv/config"
import mongoose, { mongo } from "mongoose";
import connectDB from "./db/index.js";
import {app} from "./app.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDb connection error",err);
})


// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("CONNECTION ERROR",error);
//             throw error;
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`);
//         })
//     }
//     catch(error){
//         console.log("ERROR",error);
//         throw error;
//     }
// })