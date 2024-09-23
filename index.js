require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const uuid = require('uuid');

const app = express();
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const connectDB = async () => {
    const client = new MongoClient(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");

        // Store the database reference for further operations
        const db = client.db('test'); // Replace 'gamerDB' with your actual database name

        return db;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit the process if connection fails
    }
};

// Call the connectDB function and store the DB connection
let db;
connectDB().then(database => {
    db = database;
});

// Basic route
app.get('/', (req, res) => {
    res.send('Gamer Details API');
});

// POST route to insert gamer details
app.post('/api/gamers', async (req, res) => {
    const {
        teamname, email, collegename,
        membernameone, membernametwo,
        membernamethree, membernamefour
    } = req.body;

    try {
        const newGamer = {
            id: uuid.v4(),
            teamname,
            email,
            collegename,
            membernameone,
            membernametwo,
            membernamethree,
            membernamefour,
            eventscoreone: 0,
            eventscoretwo: 0,
            eventscorethree: 0,
            eventscorefour: 0,
            eventscorefive: 0,
            created_at: new Date(),
            updated_at: new Date()
        };

        // Insert the document
        const result = await db.collection('gamers').insertOne(newGamer);

        // Fetch the newly inserted document to return
        const insertedGamer = await db.collection('gamers').findOne({ _id: result.insertedId });

        res.status(201).send(insertedGamer); // Return the newly inserted document
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});


// GET route to fetch top gamer details
app.get('/top-gamers', async (req, res) => {
    try {
        const topGamers = await db.collection('gamers').aggregate([
            {
                $addFields: {
                    totalScore: {
                        $sum: [
                            "$eventscoreone",
                            "$eventscoretwo",
                            "$eventscorethree",
                            "$eventscorefour",
                            "$eventscorefive"
                        ]
                    }
                }
            },
            { $sort: { totalScore: -1 } },
            { $limit: 10 },
            {
                $project: {
                    teamname: 1,
                    collegename: 1,
                    eventscoreone: 1,
                    eventscoretwo: 1,
                    eventscorethree: 1,
                    eventscorefour: 1,
                    eventscorefive: 1,
                    totalScore: 1
                }
            }
        ]).toArray();

        res.status(200).send(topGamers);
    } catch (err) {
        res.status(500).send({ error: 'An error occurred while retrieving the top gamers.' });
    }
});

// GET route to fetch all team names
app.get('/teams', async (req, res) => {
    try {
        const teams = await db.collection('gamers').find({}, { projection: { id: 1, teamname: 1 } }).toArray();
        res.status(200).json(teams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while retrieving the team names.' });
    }
});

// POST route to update gamer score
app.post('/gamer/score', async (req, res) => {
    try {
        const { id, teamname, eventName, score } = req.body;

        if (!id || !teamname || !eventName || score === undefined) {
            return res.status(400).json({ error: 'All fields (id, teamname, eventName, score) are required.' });
        }

        // Log the inputs for debugging
        console.log(`Received id: ${id}, teamname: ${teamname}, eventName: ${eventName}, score: ${score}`);

        const eventScoreFields = {
            eventscoreone: 'eventscoreone',
            eventscoretwo: 'eventscoretwo',
            eventscorethree: 'eventscorethree',
            eventscorefour: 'eventscorefour',
            eventscorefive: 'eventscorefive',
        };

        if (!eventScoreFields[eventName]) {
            return res.status(400).json({ error: 'Invalid event name. Valid options are: eventscoreone, eventscoretwo, eventscorethree, eventscorefour, eventscorefive.' });
        }

        // Log the update query
        console.log(`Updating score for event: ${eventName}, field: ${eventScoreFields[eventName]}`);

        const result = await db.collection('gamers').findOneAndUpdate(
            { id, teamname },
            {
                $set: {
                    [eventScoreFields[eventName]]: score,
                    updated_at: new Date()
                }
            },
            { returnDocument: 'after' }
        );
        
        // Log the result for debugging
        console.log('Result of findOneAndUpdate:', result.id);
        
        // Check for the value in the result
        if (!result.id) {
            console.log('No gamer found with the specified id and teamname.');
            return res.status(404).json({ error: 'Gamer not found' });
        }
        
        // Successful update response
        res.status(200).json({ message: 'Score updated successfully', gamer: result.value });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// GET method to fetch gamer details based on teamname
app.get('/gamer/:teamname', async (req, res) => {
    try {
        const { teamname } = req.params;

        const gamer = await db.collection('gamers').findOne({ teamname });

        if (!gamer) {
            return res.status(404).json({ error: 'Gamer not found' });
        }

        res.status(200).json({
            teamname: gamer.teamname,
            collegename: gamer.collegename,
            eventScores: {
                eventscoreone: gamer.eventscoreone,
                eventscoretwo: gamer.eventscoretwo,
                eventscorethree: gamer.eventscorethree,
                eventscorefour: gamer.eventscorefour,
                eventscorefive: gamer.eventscorefive,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
