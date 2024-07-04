const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));


// File storage configuration for uploaded certificates
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/certificates/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Load data
let data = {
    certificates: [],
    users: [],
    admin: {
        username: 'admin',
        password: 'admin'
    }
};

// Helper function to save data to JSON file
function saveData() {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

// Load data from JSON file if it exists
if (fs.existsSync('data.json')) {
    data = JSON.parse(fs.readFileSync('data.json'));
}

// Routes

// User registration
app.post('/user/register', (req, res) => {
    const { username, password } = req.body;
    console.log('Attempting user registration for username:', username);
    // Check if the username is already taken
    const existingUser = data.users.find(user => user.username === username);
    if (existingUser) {
        console.log('Registration failed. Username already exists:', username);
        // Redirect back to the registration page with an error message
        res.redirect('/user_register.html?error=username_taken');
        return;
    }
    // Add the new user to the data
    data.users.push({ username, password });
    console.log('User registered successfully:', username);
    // Save the updated data
    saveData();
    // Redirect to the login page
    res.redirect('/user_login.html');
});

// User login route
app.post('/user/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Attempting login for user:', username);
    // Check if the username and password match a user in the data
    const user = data.users.find(user => user.username === username && user.password === password);
    if (user) {
        // Set a session variable to indicate the user is logged in
        req.session.user = username;
        console.log('Login successful. Redirecting to dashboard...');
        // Redirect the user to the dashboard
        res.redirect('/user_dashboard.html');
    } else {
        // If login fails, redirect back to the login page with an error message
        console.log('Login failed. Redirecting back to login page with error message...');
        res.redirect('/user_login.html?error=invalid_credentials');
    }
});

// Define a route handler for /event
app.get('/event', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'event.html'));
});

// Modify your existing route to serve user-uploaded certificates
app.get('/certificates', (req, res) => {
    res.json({ certificates: data.certificates });
});






// Admin login
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === data.admin.username && password === data.admin.password) {
        req.session.admin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin_login.html?error=invalid_credentials');
    }
});

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/admin_login.html');
    }
}

// Admin dashboard route
app.get('/admin/dashboard', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});

// Get certificates for admin dashboard
app.get('/certificates', isAdmin, (req, res) => {
    res.json({ certificates: data.certificates });
});

// Approve certificate route
app.post('/admin/certificates/approve/:certificateId', isAdmin, (req, res) => {
    const certificateId = req.params.certificateId;
    const certificate = data.certificates.find(certificate => certificate.id === certificateId);
    if (certificate) {
        certificate.status = 'approved';
        saveData();
        res.redirect('/admin/dashboard');
    } else {
        res.status(404).send('Certificate not found');
    }
});

// Reject certificate route
app.post('/admin/certificates/reject/:certificateId', isAdmin, (req, res) => {
    const certificateId = req.params.certificateId;
    const certificate = data.certificates.find(certificate => certificate.id === certificateId);
    if (certificate) {
        certificate.status = 'rejected';
        saveData();
        res.redirect('/admin/dashboard');
    } else {
        res.status(404).send('Certificate not found');
    }
});

// Certificate upload route
app.post('/upload', upload.single('certificate'), (req, res) => {
    const { username, category, type } = req.body;
    const certificate = {
        id: Date.now().toString(),
        user: username,
        category,
        type,
        file: req.file.filename,
        status: 'pending'
    };
    data.certificates.push(certificate);
    saveData();
    res.redirect('/user_dashboard.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
