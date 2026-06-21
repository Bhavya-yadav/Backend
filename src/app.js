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

export { app }; 