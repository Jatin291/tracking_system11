const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Serve admin dashboard
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Serve user dashboard
app.get('/user-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user-dashboard.html'));
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/loginSystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    
    // Create admin user if not exists
    User.findOne({ email: 'Jatin@mail.com' }).then(admin => {
        if (!admin) {
            const adminPassword = 'jatin@28';
            bcrypt.hash(adminPassword, 10).then(hashedPassword => {
                const adminUser = new User({
                    username: 'admin',
                    email: 'Jatin@mail.com',
                    password: hashedPassword,
                    role: 'admin'
                });
                adminUser.save().catch(err => console.error('Error creating admin:', err));
            });
        }
    });
})
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    clockInTime: {
        type: Date
    },
    clockOutTime: {
        type: Date
    },
    workingHours: {
        hours: Number,
        minutes: Number,
        seconds: Number
    }
}, { timestamps: true });

// Schemas
const leaveRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: { type: String, enum: ['casual', 'sick', 'vacation'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});


// Models
const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    let token = '';
    
    if (authHeader) {
        // Handle both 'Bearer token' and plain token formats
        token = authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1]
            : authHeader;
    }
    
    if (!token) {
        console.log('No token found in header');
        return res.status(401).json({ message: 'Access denied' });
    }
    
    try {
        console.log('Verifying token:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        console.log('Token verified successfully');
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(403).json({ 
            message: 'Invalid token',
            error: err.message
        });
    }
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

// Routes
// Get server time
app.get('/api/time', (req, res) => {
    const now = new Date();
    res.json({ 
        time: now.toISOString(),
        date: now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        timeString: now.toLocaleTimeString()
    });
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', { username });
        
        // Check if admin login
        if (username === 'admin') {
            const admin = await User.findOne({ email: 'Jatin@mail.com' });
            if (!admin) {
                console.log('Admin not found');
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            const isValidPassword = await bcrypt.compare(password, admin.password);
            if (!isValidPassword) {
                console.log('Invalid admin password');
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = generateToken(admin);
            res.status(200).json({ 
                message: 'Admin login successful',
                role: admin.role,
                username: admin.username,
                email: admin.email,
                token: token
            });
        } else {
            // Regular user login
            const user = await User.findOne({ username });
            if (!user) {
                console.log('User not found:', username);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('Invalid password for user:', username);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = generateToken(user);
            res.status(200).json({ 
                message: 'User login successful',
                role: user.role,
                username: user.username,
                email: user.email,
                token: token
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin routes
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Leave request routes
app.post('/api/leave', auth, async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const username = req.user.username; // Get username from authenticated user

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const leaveRequest = new LeaveRequest({
            user: req.user._id,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason
        });

        await leaveRequest.save();
        res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
    } catch (error) {
        console.error('Error submitting leave request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/leave/history', auth, async (req, res) => {
    try {
        const username = req.user.username;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find leave history and convert IDs to strings for consistency
        const leaveHistory = await LeaveRequest.find({ user: user._id })
            .sort({ createdAt: -1 })
            .lean(); // Convert to plain JavaScript objects

        // Convert ObjectIds to strings for consistency
        const formattedHistory = leaveHistory.map(leave => ({
            ...leave,
            _id: leave._id.toString(),
            user: leave.user.toString()
        }));

        console.log('Sending leave history:', formattedHistory);
        res.status(200).json(formattedHistory);
    } catch (error) {
        console.error('Error fetching leave history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/leave/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate that the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid leave request ID' });
        }

        const leave = await LeaveRequest.findById(id);

        if (!leave) {
            console.log('Leave request not found:', id);
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Verify that the user is trying to delete their own leave request
        if (leave.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own leave requests' });
        }

        // Only allow deletion of pending requests
        if (leave.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending leave requests can be deleted' });
        }

        await LeaveRequest.findByIdAndDelete(id);
        res.status(200).json({ message: 'Leave request deleted successfully' });
    } catch (error) {
        console.error('Error deleting leave request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Attendance tracking routes
app.get('/api/attendance/history', async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Get attendance records for the user, sorted by clockInTime
        const attendanceRecords = await Attendance.find({ username })
            .sort({ clockInTime: -1 })
            .populate('username', 'username');

        res.status(200).json(attendanceRecords);
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/attendance/clock-in', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const clockInTime = new Date();

        // Check if user is already clocked in
        const existingAttendance = await Attendance.findOne({
            username,
            clockOutTime: null
        });

        if (existingAttendance) {
            return res.status(400).json({ 
                message: 'Already clocked in',
                data: existingAttendance
            });
        }

        // Create new attendance record
        const attendance = new Attendance({
            username,
            clockInTime
        });

        await attendance.save();
        res.status(200).json({ message: 'Clocked in successfully' });
    } catch (error) {
        console.error('Clock in error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/attendance/clock-out', async (req, res) => {
    try {
        // Log the raw request body
        console.log('Raw request body:', req.body);
        
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Find the latest clock-in without clock-out
        const attendance = await Attendance.findOne({
            username,
            clockOutTime: null
        }).sort({ clockInTime: -1 });

        if (!attendance) {
            return res.status(400).json({ message: 'No active clock-in found' });
        }

        // Calculate working hours
        const clockOutTime = new Date();
        const timeDiff = clockOutTime - attendance.clockInTime;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        // Update attendance record
        attendance.clockOutTime = clockOutTime;
        attendance.workingHours = {
            hours,
            minutes,
            seconds
        };

        await attendance.save();

        res.status(200).json({
            message: 'Clock-out successful',
            workingHours: {
                hours,
                minutes,
                seconds
            }
        });
    } catch (error) {
        console.error('Clock out error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add logout endpoint for session cleanup
app.get('/logout', (req, res) => {
    // Clear any session data
    res.clearCookie('connect.sid');
    res.redirect('/');
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        // Validate password length
        if (password.length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters long' });
        }

        // Validate role
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be either "user" or "admin"' });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get server time
app.get('/api/time', (req, res) => {
    try {
        // Get current server time
        const now = new Date();
        
        // Format time in ISO format
        const formattedTime = now.toISOString();
        
        // Send response
        res.status(200).json({
            time: formattedTime,
            timestamp: now.getTime(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    } catch (error) {
        console.error('Error getting server time:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Attendance API
app.get('/api/attendance/status', async (req, res) => {
    try {
        const username = req.headers.authorization?.split(' ')[1];
        if (!username) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            user: user._id,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        res.status(200).json(attendance || {});
    } catch (error) {
        console.error('Error checking attendance status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get attendance history
app.get('/api/attendance/history', async (req, res) => {
    try {
        const username = req.headers.authorization?.split(' ')[1];
        if (!username) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const attendanceRecords = await Attendance.find({
            user: user._id
        })
        .sort({ date: -1 })
        .limit(30); // Limit to last 30 records

        // Calculate duration and status for each record
        const recordsWithDetails = attendanceRecords.map(record => {
            const duration = record.clockOut ? 
                Math.round((record.clockOut - record.clockIn) / (1000 * 60)) : 0;
            
            const status = record.clockIn && !record.clockOut ? 'present' :
                          record.clockIn && record.clockOut ? 'present' :
                          'absent';

            return {
                ...record.toObject(),
                duration,
                status
            };
        });

        res.status(200).json(recordsWithDetails);
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/attendance/clock-in', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const username = authHeader.split(' ')[1];
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has already clocked in today
        const today = new Date().setHours(0, 0, 0, 0);
        const existingAttendance = await Attendance.findOne({
            user: user._id,
            date: { $gte: today }
        });

        if (existingAttendance) {
            if (existingAttendance.clockOut) {
                return res.status(400).json({ message: 'Already clocked out today' });
            }
            return res.status(400).json({ message: 'Already clocked in today' });
        }

        // Create new attendance record
        const newAttendance = new Attendance({
            user: user._id,
            date: new Date(),
            clockIn: new Date()
        });

        await newAttendance.save();
        res.json({ message: 'Successfully clocked in' });
    } catch (error) {
        console.error('Error clocking in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/attendance/clock-out', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const username = authHeader.split(' ')[1];
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has clocked in today
        const today = new Date().setHours(0, 0, 0, 0);
        const attendance = await Attendance.findOne({
            user: user._id,
            date: { $gte: today }
        });

        if (!attendance) {
            return res.status(400).json({ message: 'Please clock in first' });
        }

        if (attendance.clockOut) {
            return res.status(400).json({ message: 'Already clocked out today' });
        }

        // Update clock out time
        attendance.clockOut = new Date();
        await attendance.save();

        res.json({ message: 'Successfully clocked out' });
    } catch (error) {
        console.error('Error clocking out:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Leave request endpoints
app.post('/api/leave/request', authenticateToken, async (req, res) => {
    try {
        console.log('Leave request received:', req.body);
        
        // Validate request body
        const { leaveType, startDate, endDate, reason } = req.body;
        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required',
                requiredFields: ['leaveType', 'startDate', 'endDate', 'reason']
            });
        }

        // Validate leave type
        const validLeaveTypes = ['casual', 'sick', 'vacation'];
        if (!validLeaveTypes.includes(leaveType.toLowerCase())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid leave type',
                validTypes: validLeaveTypes
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid date format. Please use YYYY-MM-DD'
            });
        }
        if (start > end) {
            return res.status(400).json({ 
                success: false, 
                message: 'Start date cannot be after end date'
            });
        }

        // Get current user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found'
            });
        }

        // Create leave request
        const leaveRequest = new LeaveRequest({
            user: user._id,
            leaveType: leaveType.toLowerCase(),
            startDate,
            endDate,
            reason,
            status: 'pending'
        });

        // Save to database
        const savedRequest = await leaveRequest.save();
        console.log('Leave request saved:', savedRequest);

        res.status(201).json({ 
            success: true, 
            message: 'Leave request submitted successfully',
            leaveRequest: savedRequest
        });
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message
        });
    }
});

app.get('/api/leave/history', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const leaveHistory = await LeaveRequest.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate('user', 'username');

        res.json(leaveHistory);
    } catch (error) {
        console.error('Error fetching leave history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete leave request
app.delete('/api/leave/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the leave request
        const leaveRequest = await LeaveRequest.findById(id);
        
        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        // Check if the user owns this leave request
        if (leaveRequest.user.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this leave request' 
            });
        }

        // Only allow deletion of pending requests
        if (leaveRequest.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only pending leave requests can be deleted' 
            });
        }

        // Delete the leave request
        await LeaveRequest.findByIdAndDelete(id);
        
        res.json({ 
            success: true, 
            message: 'Leave request deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting leave request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete leave request',
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
