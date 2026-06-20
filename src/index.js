// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

// import express from "express";
// const app = express();

// ( async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/
//             {DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("Error connecting to MongoDB: ", error);
//             throw error;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// })();

import dotenv from "dotenv";

import connectDB from "./db/index.js";

dotenv.config({
    path : ".env",
});

connectDB()
.then(
    app.listen(process.env.PORT || 4000, () => {

        console.log(`Server is running on port 
            ${process.env.PORT || 4000}`);

        app.on("error", (error) => {
            console.log("Error connecting to MongoDB: ", error);
            throw error; 
        })
    })
) 
.catch((error) => {
    console.log("Error connecting to MongoDB: ", error);
});
