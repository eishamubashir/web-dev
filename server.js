
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/demo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected - DB: demo'))
    .catch(err => console.error('MongoDB Connection Error:', err));


const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },       
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose.model('userdata', userSchema);

// Contact 
const contactSchema = new mongoose.Schema({
    name: String, email: String, message: String,
    createdAt: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model('contacts', contactSchema);



//compalin
const complaintSchema = new mongoose.Schema({
    firstName: String, lastName: String, email: String,
    phone: String, reason: String, details: String,
    submittedAt: { type: Date, default: Date.now }
});
const Complaint = mongoose.model('complaints', complaintSchema);

//  ROUTES 

// Register 
app.post('/api/register', async (req, res) => {
    console.log("Register request:", req.body);
    let { firstName, lastName = "", email, password } = req.body;

    if (!firstName || !email || !password) {
        return res.status(400).json({ success: false, message: "First Name, Email & Password required" });
    }

    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ success: false, message: "Email already registered" });

        const newUser = new User({ firstName, lastName, email, password });
        await newUser.save();

        res.json({
            success: true,
            message: "Account created successfully!",
            user: { id: newUser._id, firstName: newUser.firstName, email: newUser.email }
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//  All Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        console.log(`Total users fetched: ${users.length}`);
        res.json({ success: true, users });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// json userdata..
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching users" });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    try {
        const { firstName, lastName = "", email } = req.body;
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, email },
            { new: true }
        ).select('-password');

        if (updated) {
            res.json({ success: true, user: updated });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Login 
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
        res.json({ success: true, message: 'Login success', user: { id: user._id, firstName: user.firstName } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});



// Contact 
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Fill all fields' });
    const contact = new ContactMessage({ name, email, message });
    await contact.save();
    res.json({ success: true, message: 'Message saved!' });
});


app.get('/api/contact', async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.json({ success: true, messages });
    } catch (err) {
        console.error(err);
        res.json({ success: false, messages: [] });
    }
});

app.delete('/api/contact/:id', async (req, res) => {
    try {
        await ContactMessage.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});




// complain
app.post('/api/complain', async (req, res) => {
    const complaint = new Complaint(req.body);
    await complaint.save();
    res.json({ success: true, message: "Complaint submitted!" });
});


app.get('/api/complain', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ submittedAt: -1 });
        res.json({ success: true, complaints });
    } catch (err) {
        res.json({ success: false, complaints: [] });
    }
});


app.delete('/api/complain/:id', async (req, res) => {
    try {
        await Complaint.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false });
    }
});

// Serve HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/home.html', (req, res) => res.sendFile(path.join(__dirname, 'home.html')));
app.get('/contact.html', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/complaint.html', (req, res) => res.sendFile(path.join(__dirname, 'complaint.html')));
app.get('/user.html', (req, res) => res.sendFile(path.join(__dirname, 'user.html')));
app.get('/contactgird.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contactgird.html'));
});

app.get('/complaingrid.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'complaingrid.html'));
});

app.get('/userdata.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'userdata.html'));
});
app.get('/contact.json.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.json.html'));
});
app.get('/complain.json.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'complain.json.html'));
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/user.html`);
});