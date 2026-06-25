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
app.use("/api/v1/user" , userRouter);
// http://localhost:5000/api/v1/user/

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});
// http://localhost:5000/health

import videoRouter from "./routes/video.routes.js"
app.use("/api/v1/videos", videoRouter)
// http://localhost:5000/videos

export { app }; 