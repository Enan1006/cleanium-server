require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.saws0i6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db("cleanium").collection("services");
        const appointmentCollection = client.db("cleanium").collection("appointment");
        const estimationCollection = client.db("cleanium").collection("estimation");
        app.get('/services', async (req, res) => {
            // const result = await servicesCollection.find({}).toArray();
            const query = {};
            const filter = servicesCollection.find(query);
            const result = await filter.toArray();
            res.send(result)
        })

        app.post('/services', async (req, res) => {
            const data = req.body;
            console.log(data);
            const query = { date: data.date, service: data.service, name: data.name };
            const exist = await appointmentCollection.findOne(query);
            if (exist) {
                return res.send({ success: false, data: exist })
            }
            const result = await appointmentCollection.insertOne(data);
            return res.send({ success: true, result })
        });

        app.get('/appointment', async (req, res) => {
            const result = await appointmentCollection.find().toArray();
            res.send(result);
        });

        app.get('/my-appointment', async (req, res) => {
            const query = req.query.email;
            console.log(query);
            const filter = { email: query };
            const cursor = appointmentCollection.find(filter);
            const result = await cursor.toArray();
            res.send(result)
        });

        app.post('/estimation', async (req, res) => {
            const data = req.body;
            console.log(data);
            const result = await estimationCollection.insertOne(data);
            res.send(result)
        });

        app.get('/estimation', async (req, res) => {
            const result = await estimationCollection.find().toArray();
            res.send(result)
        })
    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Cleanium app is running")
})

app.listen(port, () => {
    console.log(`Cleanium app is running on port, ${port}`)
})