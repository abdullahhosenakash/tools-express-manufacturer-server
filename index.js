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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@toolsexpress.uiex9tk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unAuthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db('toolsExpress').collection('tools');
    const reviewCollection = client.db('toolsExpress').collection('reviews');
    const orderCollection = client.db('toolsExpress').collection('orders');
    const userCollection = client.db('toolsExpress').collection('users');

    app.get('/tools', async (req, res) => {
      const query = {};
      const result = await toolsCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/reviews', async (req, res) => {
      const query = {};
      const result = await reviewCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    app.get('/orders', verifyJWT, async (req, res) => {
      const query = {};
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/orders/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { userEmail: email };
        const result = await orderCollection.find(query).toArray();
        return res.send(result);
      } else {
        return res.status(403).send({ message: 'forbidden access' });
      }
    });

    app.get('/users', verifyJWT, async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/create-payment-intents', async (req, res) => {
      const { totalPrice } = req.body;
      const amount = totalPrice * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.put('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const order = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedOrder = {
        $set: {
          paymentStatus: order.paymentStatus,
          shippingStatus: order.shippingStatus
        }
      };
      const result = await orderCollection.updateOne(
        filter,
        updatedOrder,
        options
      );
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { userEmail: email };
      const options = { upsert: true };
      const updatedUser = {
        $set: { userEmail: email }
      };
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );
      const result = await userCollection.updateOne(
        filter,
        updatedUser,
        options
      );
      res.send({ result, token });
    });

    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.post('/tools', async (req, res) => {
      const tool = req.body;
      const result = await toolsCollection.insertOne(tool);
      res.send(result);
    });

    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    app.delete('/tools/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    });

    app.put('/users/:id', async (req, res) => {
      const id = req.params.id;
      const userInfo = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      let updatedUser;
      if (userInfo.role) {
        updatedUser = {
          $set: {
            role: userInfo.role
          }
        };
      } else {
        updatedUser = {
          $set: {
            location: userInfo.location,
            linkedIn: userInfo.linkedIn,
            education: userInfo.education,
            phone: userInfo.phone
          }
        };
      }
      const result = await userCollection.updateOne(
        filter,
        updatedUser,
        options
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
  res.send('Tools Express running');
});

app.listen(port, () => {
  console.log("Pip Pip, Tools express running on it's track", port);
});
