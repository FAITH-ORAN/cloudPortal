const express = require('express');
require('dotenv').config();
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { setupAndCreateVM } = require('./vm');

const app = express();

// Middleware configuration
app.use(cors({
    origin: ['http://localhost:4200'], // Adjust this as per your frontend app's URL
    credentials: true,
}));

app.use(session({
    secret: 'secretKey', // Use a more secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Set to true if using https
        sameSite: 'lax' // or 'none' if you want to allow cross-site cookies
    }
}));

app.use(express.json());

// Load users data
const usersFilePath = path.join(__dirname, 'users.json');
const usersData = fs.readFileSync(usersFilePath);
const users = JSON.parse(usersData).users;

// Login endpoint
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

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out');
});

// Session check endpoint
app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    console.log(req.session)
    if (req.session.user) {
        next();
    } else {
        console.log('Access denied: user is not authenticated');
        res.status(403).send('Unauthorized');
    }
}

// Middleware to check if the user can create a VM
function canCreateVM(req, res, next) {
    const { vmType } = req.body;
    const user = req.session.user;

    if (user.credits <= 0) {
        return res.status(403).send('You do not have enough credits to create a VM.');
    }

    if (user.roles === 'USER' && vmType !== 'ubuntu') {
        return res.status(403).send('As a USER, you are only allowed to create Ubuntu VMs.');
    }

    next();
}

// Endpoint to create a VM
app.post('/create-vm', isAuthenticated, canCreateVM, async (req, res) => {
    const { vmType } = req.body; // 'ubuntu', 'debian', or 'windows'
    
    try {
        await setupAndCreateVM(vmType, res); 
        console.log(`VM creation process initiated for a ${vmType} VM.`);
    } catch (error) {
        console.error(`VM setup and creation error: ${error.message}`);
        res.status(500).send(error.message);
    }
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
