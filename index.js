const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// Define the upload directory and file storage settings for Multer
// const uploadDir = path.join(__dirname, "uploads");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); // Directory to store uploaded images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const upload = multer({ storage: storage });

// MongoDB setup
const uri = "mongodb+srv://ForexHero:M8bg8F28DFPCXYV5@cluster0.ezxu64p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("Forex02Hero").collection("users")
    const postCollection = client.db("Forex02Hero").collection("posts")
    const newsCollection = client.db("Forex02Hero").collection("news")

    // user API
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.get('/users/client/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let client = false;
      if (user) {
        client = user?.role === 'client';
      }
      res.send({ client });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.patch('/users/client/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'client'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    // posts API
    // Endpoint to handle post creation with image upload
    app.post("/posts", upload.single("image"), async (req, res) => {
      try {
        const { title, content } = req.body;
        const imageUrl = req.file.path; // Path of the uploaded image
        
        const post = { title, content, imageUrl }; // Include image URL in the post object

        const result = await postCollection.insertOne(post);
        res.send({ success: true, postId: result.insertedId });
      } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).send({ success: false, error: "Internal server error" });
      }
    });

    app.get("/posts", async (req, res) => {
      try {
        const result = await postCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ success: false, error: "Internal server error" });
      }
    });

    app.get('/posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await postCollection.findOne(query)
      res.send(result)
    })

    

    app.delete('/posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await postCollection.deleteOne(query);
      res.send(result);
    })

    //news api
    app.get('/news', async (req, res) => {
      const result = await newsCollection.find().toArray()
      res.send(result)
    })
    app.post('/news', async (req, res) => {
      const news = req.body;
      const result = await newsCollection.insertOne(news)
      res.send(result)
    })

    app.delete('/news/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await newsCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Crud is running .....");
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
