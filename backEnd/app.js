const express = require('express');
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out');
});

app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(403).send('Unauthorized');
}

app.get('/vm-selection', isAuthenticated, (req, res) => {
    res.send('This is protected content');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));