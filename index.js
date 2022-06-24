const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c1vp23d.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('toolsExpress').collection('tools');
        const reviewCollection = client.db('toolsExpress').collection('reviews');
        const orderCollection = client.db('toolsExpress').collection('orders');
        const userCollection = client.db('toolsExpress').collection('users');


    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
    res.send('Tools Express running');
});

app.listen(port, () => {
    console.log("Pip Pip, Tools express running on it's track", port);
});

