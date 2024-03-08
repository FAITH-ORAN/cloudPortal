const express = require('express');
require('dotenv').config();
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { setupAndCreateVM } = require('./vm');

const app = express();

app.use(cors({
    origin: ['http://localhost:4200'],
    credentials: true,
}));

app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.json());

const usersFilePath = path.join(__dirname, 'users.json');
const usersData = fs.readFileSync(usersFilePath);
const users = JSON.parse(usersData).users;

//login 
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.user = { id: user.id, username: user.username, roles: user.roles, credits: user.credits };
        res.json({ username: user.username, roles: user.roles, credits: user.credits });
    } else {
        res.status(401).send('Invalid credentials');
    }
});


//logout 
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out');
});


//session
app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});


//verify if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    console.log(`Access denied: user is not authenticated`);
    res.status(403).send('Unauthorized');
}

app.get('/vm-selection', isAuthenticated, (req, res) => {
    res.send('This is protected content');
});


//verify if the user have enough credit and have appropriate profile
function canCreateVM(req, res, next) {
    const user = req.session.user;
    const { vmType } = req.body;

    if (user.credits <= 0) {
        return res.status(403).send('You do not have enough credits to create a VM.');
    }

    if (user.roles === 'USER' && vmType !== 'linux') {
        return res.status(403).send('As a USER, you are only allowed to create Linux VMs.');
    }

    if (user.roles === 'SUPERUSER') {
        // SUPERUSER can create any type of VM, no further checks needed
        return next();
    }

    // If the user is a USER and trying to create a linux VM, or any checks specific to other roles.
    next();
}



app.post('/create-vm', isAuthenticated, canCreateVM, async (req, res) => {
  const { vmType } = req.body; // 'linux', 'debian', or 'windows'
  console.log(`Received request to setup and create a ${vmType} VM`);
  
  try {
    await setupAndCreateVM(vmType, res); 
    console.log(`Setup and VM creation process started for a ${vmType} VM`);
  } catch (error) {
    console.error(`Error during setup and VM creation: ${error.message}`);
    res.status(500).send(error.message);
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));