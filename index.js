require('dotenv').config();
const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.saws0i6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: "Access denied" })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Acess forbiddenn" })
        }
        req.decoded = decoded;
        next();
    }
    );
}

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db("cleanium").collection("services");
        const appointmentCollection = client.db("cleanium").collection("appointment");
        const estimationCollection = client.db("cleanium").collection("estimation");
        const usersCollection = client.db("cleanium").collection("users");
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
        });

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = await usersCollection.findOne({ email: email });
            const isAdmin = query.role === 'admin';
            res.send({ admin: isAdmin })
        })

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const data = req.body;
            const filter = { email: email };
            const updateDoc = {
                $set: data
            };
            const options = { upsert: true };
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send({ result, token })
        });

        app.get('/users', verifyJWT, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        app.put('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        });

        app.post('/add-service', async (req, res) => {
            const data = req.body;
            const result = await servicesCollection.insertOne(data);
            res.send(result)
        });

        app.delete('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        });

        app.delete('/services/:id', async (req, res) => {
            const serviceId = req.params.id;
            const filter = { _id: ObjectId(serviceId) };
            const result = await servicesCollection.deleteOne(filter);
            res.send(result);
            console.log(result)
        });

        app.put('/services/:id', async (req, res) => {
            const serviceId = req.params.id;
            const filter = { _id: ObjectId(serviceId) };
            const data = req.body;
            const updateDoc = {
                $set: data
            };
            const options = { upsert: true };
            const result = await servicesCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        });

        app.post('/make-payment', async (req, res) => {

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