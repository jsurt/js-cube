const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { Solve, User } = require('./models')

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
    res.status(200);
});

app.get('/timer', (req, res) => {
    res.sendFile(__dirname + '/public/timer.html');
    res.status(200);
});

app.get('/solves', (req, res) => {
    res.sendFile(__dirname + '/public/solves.html');
    Solve
        .find()
        .then(solves => {
            res.json({
              solves: solves.map(
                (solves) => solves.serialize())
            })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        });
    res.status(200);
});

app.get('/solves/:id', (req, res) => {
    Solve 
        .findById(req.params.id)
        .then(solve => res.json(solve.serialize()))
        .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal server error'});
        });
});

app.post('/solves', (req, res) => {
    const requiredFields = ['time', 'notes', 'scrambleAlg'];
    for (let i = 0; i < requiredFields.length; i++) {
      const field = requiredFields[i];
      if (!(field in req.body)) {
        const msg = `Missing ${field} field in request body`;
        console.error(msg);
        res.status(400).send(msg);
      }
    };
    Solve.create({
      time: req.body.time,
      notes: req.body.notes,
      scrambleAlg: req.body.scrambleAlg,
      date: new Date()
    })
        .then(solve => res.status(201).json(solve.serialize()))
        .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal server error'});
        });
});

app.put('/solves/:id', (req, res) => {
    if (req.body.id !== req.params.id) {
      const msg = 'Request id in body must match with id in params';
      console.error(msg);
      res.status(400).send(msg);
    }
    let toUpdate = {};
    const updateableFields = ['notes'];
    updateableFields.forEach(field => {
      if (field in req.body) {
        toUpdate[field] = req.body[field];
      }
    });
    Solve.findByIdAndUpdate(req.params.id, { $set: toUpdate })
      .then(solve => {
        res.status(204).end()
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
      });
});

app.delete('/solves/:id', (req, res) => {
    Solve.findByIdAndRemove(req.params.id)
      .then(solve => {
        res.status(204).end();
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
      });
});

app.post('/users', (req, res) => {
    const requiredFields = ['firstName', 'lastName', 'email', 'userName'];
    for (let i = 0; i < requiredFields.length; i++) {
      const field = requiredFields[i];
      if (!(field in req.body)) {
        const msg = `Missing ${field} field in request body`;
        console.error(msg);
        res.status(400).send(msg);
      }
    };
    User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      userName: req.body.userName
    })
      .then(user => {
        res.status(200).json(user.serialize())
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
      })
});

let server;

function runServer(databaseUrl, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }

      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    }, {useNewUrlParser: true});
  });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
      return new Promise((resolve, reject) => {
        console.log("Closing server");
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }

if (require.main === module) {
runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };