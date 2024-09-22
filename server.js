require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const uuid = require('uuid');
const Gamer = require('./models/GamerDetails'); // MongoDB model


const app = express();
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error(err));

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
        teamname,
        email,
        collegename,
        membernameone,
        membernametwo,
        membernamethree,
        membernamefour
      });
  
      const savedGamer = await newGamer.save();  // Save to MongoDB
      res.status(201).send(savedGamer);  // Return the saved object
    } catch (err) {
      res.status(400).send({ error: err.message });
    }
  });

// GET route to fetch top gamer details
app.get('/top-gamers', async (req, res) => {
  try {
      // Aggregate to calculate total score, sort, and project only required fields
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
          { $sort: { totalScore: -1 } }, // Sort in descending order
          { $limit: 10 },                // Limit to top 10
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
      // Fetch all teams with only their id and teamname
      const teams = await Gamer.find({}, 'id teamname'); // Select only id and teamname

      res.status(200).json(teams);
  } catch (err) {
      res.status(500).json({ error: 'An error occurred while retrieving the team names.' });
  }
});


// POST route to update gamer score
app.post('/gamer/score', async (req, res) => {
    try {
        const { id, teamname, eventName, score } = req.body;

        // Check if required data is provided
        if (!id || !teamname || !eventName || score === undefined) {
            return res.status(400).json({ error: 'All fields (id, teamname, eventName, score) are required.' });
        }

        // Define valid event names and their corresponding field names in the schema
        const eventScoreFields = {
            eventscoreone: 'eventscoreone',
            eventscoretwo: 'eventscoretwo',
            eventscorethree: 'eventscorethree',
            eventscorefour: 'eventscorefour',
            eventscorefive: 'eventscorefive',
        };

        // Check if the event name provided is valid
        if (!eventScoreFields[eventName]) {
            return res.status(400).json({ error: 'Invalid event name. Valid options are: eventscoreone, eventscoretwo, eventscorethree, eventscorefour, eventscorefive.' });
        }

        // Find the gamer by id and teamname
        const gamer = await Gamer.findOne({ id, teamname });

        if (!gamer) {
            return res.status(404).json({ error: 'Gamer not found' });
        }

        // Update the specific event score
        gamer[eventScoreFields[eventName]] = score;

        // Update the updated_at timestamp
        gamer.updated_at = Date.now();

        // Save the updated gamer record
        await gamer.save();

        res.status(200).json({ message: 'Score updated successfully', gamer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET method to fetch teamname, collegename, and event scores based on teamname
app.get('/gamer/:teamname', async (req, res) => {
    try {
        const { teamname } = req.params;

        // Find the gamer by teamname
        const gamer = await Gamer.findOne({ teamname });

        if (!gamer) {
            return res.status(404).json({ error: 'Gamer not found' });
        }

        // Send the response with teamname, collegename, and event scores
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
