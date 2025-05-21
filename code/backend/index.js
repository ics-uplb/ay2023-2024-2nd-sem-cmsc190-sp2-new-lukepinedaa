require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:3000', 'https://hananet.vercel.app', 'https://sp-eykc.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

mongoose.connection.on('error', err => {
  console.log('MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

// SCHEMA
const titleSchema = new mongoose.Schema({
  name: { type: String, required: true},
  baseSalary : { type: Number, required: true}
})

const Title= mongoose.model('Title', titleSchema);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthday: { type: Date, required: true },
  address: { type: String, required: true },
  employmentDate: {type: Date, required: true},
  titleId : { type: mongoose.Schema.Types.ObjectId, ref: 'Title', required: true},
  salaryHistoryId : { type : mongoose.Schema.Types.ObjectId, ref: 'SalaryHistory'},
  userUpdates : [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserRequest'}],
  role: {type: String, required: true},
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

const User = mongoose.model('User', userSchema);

const salaryModificationSchema = new mongoose.Schema({
  amount : {type : Number, required: true},
  description: { type: String, required: true},
  date: { type: Date, default: Date.now}
})

const SalaryModification = mongoose.model('SalaryModification', salaryModificationSchema);

  const salarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    baseSalary : {type: Number, required: true},
    modifications: [{ type:mongoose.Schema.Types.ObjectId, ref : "SalaryModification"}],
    finalSalary: {type: Number, required: true},
    date: { type: Date, default: Date.now, required: true},
  })

const Salary = mongoose.model("Salary", salarySchema);

const salaryHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  salaries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Salary"}]
})

const SalaryHistory = mongoose.model('SalaryHistory', salaryHistorySchema);

const userRequestSchema = new mongoose.Schema({
  email: { type: String, required: true},
  updates: { type: Map, of: mongoose.Schema.Types.Mixed, required: true},
  status: {type: String, enum: ['pending', 'approved', 'declined'], default: 'pending'},
  requestedAt: { type: Date, default: Date.now},
})

const UserRequest = mongoose.model('UserRequest', userRequestSchema);

const leaveRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  firstName: {type : String, required: true},
  lastName: {type: String, required: true},
  leaveType: { type: String, required: true },
  otherReason: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  daysRequested: { type: Number, required: true },
  comments: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now }
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'present' }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://hananet.vercel.app' 
    : 'http://localhost:3000';
    
  const verificationlink = `${frontendUrl}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Hana-net Philippines - Email Verification',
    html:
      `<h1> Email Verification</h1>
      <p>Click the link below to verify your email address: </p>
      <a href="${verificationlink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://hananet.vercel.app' 
    : 'http://localhost:3000';
    
  const resetlink = `${frontendUrl}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Hana-net Philippines - Password Reset',
    html:
    `<h1>Password Reset Request</h1>
    <p> Please click the link below to reset your password</p>
    <a href="${resetlink}">Reset Password</a>
    <p>Link will expire in 1 hour</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  }catch (error){
    console.error ("Error sending password reset email: ", error);
    return false;
  }
};


app.post('/signup', async (req, res) => {
  const { email, password, firstName, lastName, birthday, address } = req.body;

    try {
        const uemail = email.toLowerCase();
        const existingUser = await User.findOne({ email: uemail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24);


        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultTitle = await Title.findOne({ name: 'Employee Default' });
        const newUser = new User({
          email: uemail,
          password: hashedPassword,
          firstName,
          lastName,
          birthday: new Date(birthday),
          address,
          employmentDate: new Date(),
          titleId: defaultTitle._id,
          userUpdates: [],
          role: "Employee",
          isVerified: false,
          verificationToken: verificationToken,
          verificationTokenExpires: tokenExpires,
      });
      const savedUser = await newUser.save();
      const newSalaryHistory = new SalaryHistory({
        userId: savedUser._id,
        salaries: []
      });
      const savedSalaryHistory = await newSalaryHistory.save();
      savedUser.salaryHistoryId = savedSalaryHistory._id;
      await savedUser.save();

      const newSalary = new Salary({
        userId: savedUser._id,
        baseSalary: defaultTitle.baseSalary,
        modifications: [],
        finalSalary: defaultTitle.baseSalary,
        date: new Date(),
      });

      await newSalary.save();
      await SalaryHistory.findByIdAndUpdate(savedUser.salaryHistoryId, {$push: { salaries: newSalary._id }});

      const emailSent = await sendVerificationEmail(uemail, verificationToken);

      if (emailSent) {
        res.status(201).json({ message: 'User created successfully. Please check your email to verify your account.' });
      } else {
        res.status(201).json({ message: 'User created successfully but failed to send verification email. Please contact support.' });
      }
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

app.get('/verify-email/:token', async (req,res) => {
  const { token } = req.params;
  
  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
})

app.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  
  try {
    const uemail = email.toLowerCase();
    const user = await User.findOne({ email: uemail });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);
    
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = tokenExpires;
    await user.save();
    
    const emailSent = await sendVerificationEmail(uemail, verificationToken);
    
    if (emailSent) {
      res.status(200).json({ message: 'Verification email has been resent' });
    } else {
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ message: 'Error resending verification email', error: error.message });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const uemail = email.toLowerCase();
    const user = await User.findOne({ email: uemail });
    
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, a password reset link will be sent.' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); 
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();
    
    const emailSent = await sendPasswordResetEmail(uemail, resetToken);
    
    if (emailSent) {
      res.status(200).json({ message: 'Password reset email has been sent' });
    } else {
      res.status(500).json({ message: 'Failed to send password reset email' });
    }
  } catch (error) {
    console.error('Error processing forgot password request:', error);
    res.status(500).json({ message: 'Error processing forgot password request', error: error.message });
  }
});

app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const uemail = email.toLowerCase();
    const user = await User.findOne({ email: uemail });
    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    }
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: 'Email not verified. Please verify your email before logging in.',
        needsVerification: true,
        email: uemail
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    
    res.status(200).json({ message: 'Login successful', email:user.email, firstName: user.firstName, lastName: user.lastName, role : user.role});

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

app.post('/retrieveUserData', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email }).select('-password').populate('titleId');

    if (!user) {
      return res.status(404).json({ message : 'User not found'});
    }
    res.json(user);

  } catch (error){
    console.error('Error retrieving user data:', error);
    res.status(500).json({ message : 'Error retrieving user data', error: error.message});
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'Admin' } }).populate('titleId', 'name').select('-password');

    res.json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

app.post('/createtitle', async (req, res) => {
  const { name, baseSalary } = req.body;

  try {
    const existing = await Title.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Title already exists' });
    }

    const newTitle = new Title({ name, baseSalary });
    const saved = await newTitle.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating title:', error);
    res.status(500).json({ message: 'Error creating title', error: error.message });
  }
});

app.get('/gettitles', async (req, res) => {
  try {
    const titles = await Title.find();
    res.json(titles);
  } catch (error) {
    console.error('Error fetching titles:', error);
    res.status(500).json({ message: 'Error fetching titles', error: error.message });
  }
});

app.get('/getusersbytitle', async (req, res) => {
  const { title } = req.query;

  try {
    let users;
    if (title) {
      const titleDoc = await Title.findOne({ name: title });
      if (!titleDoc) {
        return res.status(404).json({ message: 'Title not found' });
      }

      users = await User.find({ role: { $ne: 'Admin'} , titleId: titleDoc._id }).select('-password').populate('titleId', 'name');
    } else {
      users = await User.find({ role: { $ne: 'Admin' } }).select('-password').populate('titleId', 'name');
    }

    res.json(users);
  } catch (error) {
    console.error('Error retrieving users by title:', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

app.put('/updatetitle/:id', async (req, res) => {
  const { name, baseSalary } = req.body;

  try {
    const updated = await Title.findByIdAndUpdate(req.params.id,{ name, baseSalary },{ new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Title not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating title:', error);
    res.status(500).json({ message: 'Error updating title', error: error.message });
  }
});

app.put('/updateUserTitle', async (req, res) => {
  const { userId, newTitleId } = req.body;

  try {
    const user = await User.findById(userId).populate('titleId').populate('salaryHistoryId');
    if (!user) return res.status(404).json({ message: "User not found" });

    const newTitle = await Title.findById(newTitleId);
    if (!newTitle) return res.status(404).json({ message: "New title not found" });

    user.titleId = newTitleId;
    await user.save();

      const base = newTitle.baseSalary;
      const newSalary = new Salary({
        userId: user._id,
        baseSalary: base,
        modifications: [],
        finalSalary: base,
        date: new Date(),
      });

      await newSalary.save();

      if (!user.salaryHistoryId) {
        const newHistory = new SalaryHistory({
          userId: user._id,
          salaries: [newSalary._id],
        });
        await newHistory.save();
        user.salaryHistoryId = newHistory._id;
        await user.save();
      } else {
        await SalaryHistory.findByIdAndUpdate(user.salaryHistoryId, {$push: { salaries: newSalary._id }});
      }

    res.status(200).json({ message: "Title updated and salary handled successfully" });
  } catch (err) {
    console.error('Failed to update title:', err);
    res.status(500).json({ message: "Failed to update title", error: err.message });
  }
});

app.get('/latestSalary/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }).populate('salaryHistoryId');
    if (!user || !user.salaryHistoryId) {
      return res.status(404).json({ message: 'Salary history not found for this user' });
    }

    const userSalaryHistory = await SalaryHistory.findById(user.salaryHistoryId).populate({
      path: 'salaries',
      populate: {path: 'modifications'}
    });
    
    if (!userSalaryHistory || !Array.isArray(userSalaryHistory.salaries) || userSalaryHistory.salaries.length === 0) {
      return res.status(404).json({ message: 'No salary records found' });
    }
      
    const latestSalary = userSalaryHistory.salaries[userSalaryHistory.salaries.length - 1];

    res.status(200).json(latestSalary);
  } catch (error) {
    console.error('Error retrieving latest salary:', error);
    res.status(500).json({ message: 'Error retrieving latest salary', error: error.message });
  }
});

app.get('/salaryHistory/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }).populate({
      path: 'salaryHistoryId',
      populate: {
        path: 'salaries',
        populate: {path: 'modifications'}
      }
    });

    if (!user || !user.salaryHistoryId) {
      return res.status(404).json({ message: 'Salary history not found' });
    }

    res.json(user.salaryHistoryId.salaries);
  } catch (error) {
    console.error('Error fetching salary history:', error);
    res.status(500).json({ message: 'Error fetching salary history', error: error.message });
  }
});

app.post('/requestProfileUpdate', async (req, res) => {
  const { email, updates } = req.body;

  try {
    const newRequest = new UserRequest({
      email,
      updates
    });

    await User.findOneAndUpdate({ email },{ $push: { userUpdates: newRequest._id } });

    await newRequest.save();

    res.json({ message: 'Profile update request submitted for approval.' });
  } catch (error) {
    console.error('Error creating update request:', error);
    res.status(500).json({ message: 'Server error submitting update request.', error: error.message });
  }
});

app.get('/adprofileUpdateRequests/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const requests = await UserRequest.find({ email, status: 'pending' });
    res.json(requests);
  } catch (err) {
    console.error('Error retrieving update requests:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/profileUpdateRequests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const request = await UserRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Update request not found' });
    }

    request.status = status;
    await request.save();

    if (status === 'approved') {
      const { email, updates } = request;

      const updateObject = {};
      updates.forEach((value, key) => {
        updateObject[key] = value;
      });

      const updatedUser = await User.findOneAndUpdate({ email },{ $set: updateObject },{ new: true });
    }

    res.json({request});
  } catch (error) {
    console.error('Error updating profile request status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/emprofileUpdateRequests/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }).populate({
      path: 'userUpdates',
      options: { sort: { requestedAt: -1 } }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.userUpdates);
  } catch (err) {
    console.error('Error retrieving update requests from userUpdates:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/salary/modify/:email', async (req, res) => {
  const { email } = req.params;
  const { amount, description } = req.body;

  try {
    const user = await User.findOne({ email }).populate('salaryHistoryId');
    if (!user || !user.salaryHistoryId) {
      return res.status(404).json({ message: 'User or salary history not found' });
    }

    const salaryHistory = await SalaryHistory.findById(user.salaryHistoryId).populate('salaries');
    if (!salaryHistory || salaryHistory.salaries.length === 0) {
      return res.status(404).json({ message: 'No salary records found' });
    }

    const latestSalary = salaryHistory.salaries[salaryHistory.salaries.length - 1];

    const newModification = new SalaryModification({
      amount: amount,
      description: description,
      date: new Date(),
    });

    await newModification.save();

    latestSalary.modifications.push(newModification._id);
    await latestSalary.populate('modifications');

    const totalModifications = latestSalary.modifications.reduce((acc, mod) => acc + mod.amount, 0);
    latestSalary.finalSalary = latestSalary.baseSalary + totalModifications;

    await latestSalary.save();

    res.status(200).json({ message: 'Salary modification added successfully', latestSalary });
  } catch (error) {
    console.error('Error modifying salary:', error);
    res.status(500).json({ message: 'Server error modifying salary', error: error.message });
  }
});

app.post('/applyLeave', async (req, res) => {
  const { email, firstName, lastName, leaveType, otherReason, startDate, endDate, daysRequested, comments } = req.body;
  
  try {
    const newLeaveRequest = new LeaveRequest({
      email,
      firstName,
      lastName,
      leaveType,
      otherReason,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      daysRequested,
      comments
    });
    
    await newLeaveRequest.save();
    res.status(201).json({ message: 'Leave request submitted successfully', request: newLeaveRequest });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
});

app.get('/leaveRequests/:email', async (req, res) => {
  const { email } = req.params;
  
  try {
    const leaveRequests = await LeaveRequest.find({ email }).sort({ requestedAt: -1 });
    
    res.json(leaveRequests);
  } catch (error) {
    console.error('Error retrieving leave requests:', error);
    res.status(500).json({ message: 'Error retrieving leave requests', error: error.message });
  }
});

app.get('/admin/leaveRequests', async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find().sort({ requestedAt: -1 });
    
    res.json(leaveRequests);
  } catch (error) {
    console.error('Error retrieving leave requests:', error);
    res.status(500).json({ message: 'Error retrieving leave requests', error: error.message });
  }
});

app.put('/admin/leaveRequests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const updatedRequest = await LeaveRequest.findByIdAndUpdate(id,{ status },{ new: true });
    
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    res.json({ message: `Leave request ${status}`, request: updatedRequest });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Error updating leave request', error: error.message });
  }
});

app.get('/admin/stats', async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: { $ne: 'Admin' } });
    const pendingLeaveRequests = await LeaveRequest.countDocuments({ status: 'pending' });
    const pendingProfileUpdates = await UserRequest.countDocuments({ status: 'pending' });
    
    res.json({totalEmployees, pendingLeaveRequests, pendingProfileUpdates});
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
});
  
app.delete('/deleteEmployee/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.salaryHistoryId) {
        const salaryHistory = await SalaryHistory.findById(user.salaryHistoryId);
        if (salaryHistory) {
          for (const salaryId of salaryHistory.salaries) {
            const salary = await Salary.findById(salaryId);
            if (salary) {
              for (const modId of salary.modifications) {
                await SalaryModification.findByIdAndDelete(modId);
              }
              await Salary.findByIdAndDelete(salaryId);
            }
          }
          await SalaryHistory.findByIdAndDelete(user.salaryHistoryId);
        }
      }
      await Attendance.deleteMany({ email });
      
      await LeaveRequest.deleteMany({ email });
      
      await UserRequest.deleteMany({ email });
      
      await User.findOneAndDelete({ email });
      
      
      res.status(200).json({ message: 'Employee and all associated data deleted successfully' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
  });
  
  app.patch('/salary/updateDate/:email/:salaryId', async (req, res) => {
    try {
      const { email, salaryId } = req.params;
      const { newDate } = req.body;
      
      if (!newDate) {
        return res.status(400).json({ message: 'New date is required' });
      }
      
      const isValidDate = !isNaN(new Date(newDate).getTime());
      if (!isValidDate) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const salary = await Salary.findById(salaryId);
      if (!salary) {
        return res.status(404).json({ message: 'Salary record not found' });
      }

      salary.date = new Date(newDate);
      await salary.save();
      
      res.status(200).json(salary);
    } catch (error) {
      console.error('Error updating salary date:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  
  });

  app.patch('/updateEmploymentDate/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const { newDate } = req.body;
      
      if (!newDate) {
        return res.status(400).json({ message: 'New date is required' });
      }
      
      const isValidDate = !isNaN(new Date(newDate).getTime());
      if (!isValidDate) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      user.employmentDate = new Date(newDate);
      await user.save();
      
      res.status(200).json({ message: 'Employment date updated successfully', employmentDate: user.employmentDate });
    } catch (error) {
      console.error('Error updating employment date:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  app.post('/attendance/checkIn', async (req, res) => {
    const { email, date, status } = req.body;
    
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const today = new Date(date);
      today.setHours(0, 0, 0, 0);
      
      const checkInTime = new Date();
      
      let attendance = await Attendance.findOne({ 
        email,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (attendance) {
        attendance.checkIn = checkInTime;
        attendance.status = status || 'present';
        await attendance.save();
      } else {
        attendance = new Attendance({
          userId: user._id,
          email,
          date: today,
          checkIn: checkInTime,
          status: status || 'present'
        });
        await attendance.save();
      }
      
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error checking in:', error);
      res.status(500).json({ message: 'Error checking in', error: error.message });
    }
  });
  
  app.post('/attendance/checkOut', async (req, res) => {
    const { email, date } = req.body;
    
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const today = new Date(date);
      today.setHours(0, 0, 0, 0);
      
      const checkOutTime = new Date();
      
      let attendance = await Attendance.findOne({ 
        email,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (attendance) {
        attendance.checkOut = checkOutTime;
        await attendance.save();
        res.status(200).json(attendance);
      } else {
        return res.status(400).json({ message: 'Must check in before checking out' });
      }
    } catch (error) {
      console.error('Error checking out:', error);
      res.status(500).json({ message: 'Error checking out', error: error.message });
    }
  });
  
  const markAbsentEmployees = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const users = await User.find({ role: { $ne: 'Admin' } });
      
      for (const user of users) {
        const attendance = await Attendance.findOne({
          email: user.email,
          date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        if (!attendance) {
          const absentRecord = new Attendance({
            userId: user._id,
            email: user.email,
            date: today,
            status: 'absent'
          });
          await absentRecord.save();
        }
      }
      
      console.log('Absent employees marked successfully');
    } catch (error) {
      console.error('Error marking absent employees:', error);
    }
  };
  
  cron.schedule('59 23 * * *', markAbsentEmployees);
  
  app.get('/attendance/:email/:month/:year', async (req, res) => {
    const { email, month, year } = req.params;
    
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const attendance = await Attendance.find({
        email,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ date: 1 });
      
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
  });
app.delete('/deletetitle/:id', async (req, res) => {
  try {
    const titleId = req.params.id;
    
    const usersWithTitle = await User.find({ 'titleId': titleId });
    
    if (usersWithTitle.length > 0) {
      return res.status(400).json({
        message: `Cannot delete this title because ${usersWithTitle.length} employee(s) are assigned to it. Please reassign these employees first.`
      });
    }
    
    const deletedTitle = await Title.findByIdAndDelete(titleId);
    
    if (!deletedTitle) {
      return res.status(404).json({ message: 'Job title not found' });
    }
    
    return res.status(200).json({ message: 'Job title deleted successfully', deletedTitle });
  } catch (error) {
    console.error('Error deleting job title:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});
app.delete('/salary/deleteModification/:email/:salaryId', async (req, res) => {
  try {
    const { email, salaryId } = req.params;
    const { modificationIndex } = req.body;
    
    const salary = await Salary.findById(salaryId);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    if (salary.modifications && salary.modifications.length > modificationIndex) {
      salary.modifications.splice(modificationIndex, 1);
      
      let modificationSum = 0;
      if (salary.modifications && salary.modifications.length > 0) {
        modificationSum = salary.modifications.reduce((sum, mod) => {
          const amount = typeof mod.amount === 'number' ? mod.amount : 0;
          return sum + amount;
        }, 0);
      }
      
      const baseSalary = typeof salary.baseSalary === 'number' ? salary.baseSalary : 0;
      
      salary.finalSalary = baseSalary + modificationSum;
      
      await salary.save();
      
      return res.status(200).json(salary);
    } else {
      return res.status(400).json({ message: 'Invalid modification index' });
    }
  } catch (error) {
    console.error('Error deleting modification:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
  async function generateMonthlySalaries() {
    try {
      const users = await User.find({ role: { $ne: 'Admin' } }).populate('titleId').populate('salaryHistoryId');
  
      for (const user of users) {
        const base = user.titleId.baseSalary;
  
        const newSalary = new Salary({
          userId: user._id,
          baseSalary: base,
          modifications: [], 
          finalSalary: base,
          date: new Date(), 
        });
  
        await newSalary.save();
  
        if (!user.salaryHistoryId) {
          const newHistory = new SalaryHistory({
            userId: user._id,
            salaries: [newSalary._id],
          });
          await newHistory.save();
          user.salaryHistoryId = newHistory._id;
          await user.save();
        } else {
          await SalaryHistory.findByIdAndUpdate(user.salaryHistoryId, {$push: { salaries: newSalary._id }});
        }
      }
  
      console.log('Monthly salaries generated.');
    } catch (error) {
      console.error('Error generating monthly salaries:', error);
    }
  }
  
  cron.schedule('0 0 1 * *', () => {
    console.log('Running monthly salary generation...');
    generateMonthlySalaries();
  }, {
    scheduled: true,
    timezone: "Asia/Manila" 
  });
  
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });
  
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message });
  });
  
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
 