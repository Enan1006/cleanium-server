require('dotenv').config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express());

app.get('/', (req, res) => {
    res.send("Cleanium app is running")
})

app.listen(port, () => {
    console.log(`Cleanium app is running on port, ${port}`)
})