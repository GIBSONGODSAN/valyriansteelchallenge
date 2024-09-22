require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const uuid = require('uuid');
const Gamer = require('./models/GamerDetails'); // MongoDB model

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());

module.exports = app; // Ensure this line is present

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit the process if connection fails
    }
};

connectDB(); // Call the connect function

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
        const newGamer = new Gamer({
            id: uuid.v4(),
            teamname,
            email,
            collegename,
            membernameone,
            membernametwo,
            membernamethree,
            membernamefour
        });

        const savedGamer = await newGamer.save();
        res.status(201).json(savedGamer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET route to fetch top gamer details
app.get('/top-gamers', async (req, res) => {
    try {
        const topGamers = await Gamer.aggregate([
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
        ]);

        res.status(200).json(topGamers);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while retrieving the top gamers.' });
    }
});

// GET route to fetch all team names
app.get('/teams', async (req, res) => {
    try {
        const teams = await Gamer.find({}, 'id teamname');
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

        const gamer = await Gamer.findOne({ id, teamname });

        if (!gamer) {
            return res.status(404).json({ error: 'Gamer not found' });
        }

        gamer[eventScoreFields[eventName]] = score;
        gamer.updated_at = Date.now();

        await gamer.save();

        res.status(200).json({ message: 'Score updated successfully', gamer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET method to fetch gamer details based on teamname
app.get('/gamer/:teamname', async (req, res) => {
    try {
        const { teamname } = req.params;

        const gamer = await Gamer.findOne({ teamname });

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


