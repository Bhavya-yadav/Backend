// Using Try Catch block to handle errors 
// connecting to MongoDB and starting the server.

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
import { app } from "./app.js";
import connectDB from "./db/index.js";

// Load environment values before starting the server.
dotenv.config({
    path : ".env",
});

// Connect to MongoDB, then start the app.
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
