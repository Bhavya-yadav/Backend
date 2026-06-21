import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()

// Allow the frontend origin to call the API with cookies.
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}))

// Parse JSON, form data, and static files for the app.
app.use(express.json({ limit : "32kb"}))
app.use(express.urlencoded ({ extended : true , limit : "32kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Import and use the user routes.
import userRouter from "./routes/user.routes.js";

// Use the user routes for both singular and plural base paths.
app.use("/api/v1/user" , userRouter);
app.use("/api/v1/users" , userRouter);

// http://localhost:8000/api/v1/user/register

export { app }; 