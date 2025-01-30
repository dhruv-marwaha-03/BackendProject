import "dotenv/config";
import express from 'express';
import connectDB from './db/index.js';
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(cors())

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDb connection error",err);
})

export {app};