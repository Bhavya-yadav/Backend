import 'dotenv/config';
import express from 'express';

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/google', (req,res) => {
    res.send('Good Morning!')
})

app.get('/login', (req,res) => {
    res.send('<h1>Login Page</h1>')
})

app.get('/signup', (req,res) => {
    res.send('<h1>Signup Page</h1>')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})