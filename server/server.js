// Import Dependencies
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import multer from "multer";
import stream from "stream";
import csvParser from "csv-parser";
import FormData from 'form-data';
import axios from 'axios';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();


const secretKey = process.env.JWT_SECRET;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Middleware Configuration
app.use(express.json());
app.use(
    cors({
        origin: 'http://localhost:5173', // Adjust based on your frontend's URL
        credentials: true, // Allow credentials (cookies)
    })
);
app.use(cookieParser());

// Determine the database configuration based on an environment variable
const isPartnerEnvironment = process.env.USE_PARTNER_DB === 'true';

// MySQL Connection Setup
const db = mysql.createConnection({
    host: isPartnerEnvironment ? process.env.PARTNER_DB_HOST : process.env.DB_HOST,
    user: isPartnerEnvironment ? process.env.PARTNER_DB_USER : process.env.DB_USER,
    password: isPartnerEnvironment ? process.env.PARTNER_DB_PASS : process.env.DB_PASS,
    database: isPartnerEnvironment ? process.env.PARTNER_DB_NAME : process.env.DB_NAME,
});

// Connect to the Database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

const saltRounds = 10; // Increased salt rounds for better security

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify Nodemailer Configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error configuring email transporter:', error);
    } else {
        console.log('Email transporter is ready.');
    }
});

// Rate Limiter for Authentication Routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { Error: 'Too many attempts, please try again later after 15 minutes.' },
});

// Helper Function to Hash OTPs
const hashOtp = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

// Set up multer storage in memory


// Registration Route
const registerSchema = Joi.object({
    fullName: Joi.string().min(3).required().messages({
        'string.base': 'Full name must be a string',
        'string.min': 'Full name must be at least 3 characters long',
        'any.required': 'Full name is required',
    }),
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
    }),
    password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$')).required().messages({
        'string.base': 'Password must be a string',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
    }),
});


const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'string.base': 'Password must be a string',
        'any.required': 'Password is required',
    }),
});

// Registration Route
app.post('/register', (req, res) => {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
        return res.status(400).json(error.details[0].message); // Return the first error message
    }

    const { fullName, email, password } = value;

    // Check if email already exists
    const emailCheckQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(emailCheckQuery, [email], (err, result) => {
        if (err) {
            return res.status(500).json('Database Error');
        }
        if (result.length > 0) {
            return res.status(400).json('Email already in use');
        }

        // Hash the password
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                return res.status(500).json('Error hashing password');
            }

            // Generate a UUID for user_id
            const userId = uuidv4();

            // Prepare values to insert into the database
            const values = [userId, fullName, email, hash];

            // Insert new user into the database
            const sql = 'INSERT INTO users (user_id, fullName, email, password) VALUES (?)';
            db.query(sql, [values], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json('Database Error');
                }
                return res.status(201).json('User registered successfully');
            });
        });
    });
});

// Login Route
const hashOtplogin = (otp) => bcrypt.hashSync(otp, 10);
// Login Route - Step 1: User enters email and password
// Login Route
// Add nodemailer

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ Error: 'Database Error' });
        }

        if (result.length === 0) {
            console.log("Email not found:", email);
            return res.status(400).json({ Error: 'Email does not exist' });
        }

        const user = result[0];
        console.log("User found:", user.user_id);

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ Error: 'Error comparing passwords' });
            }

            if (!isMatch) {
                console.log("Incorrect password attempt for email:", email);
                return res.status(400).json({ Error: 'Incorrect password' });
            }

            console.log("Password matched for email:", email);

            // Delete existing OTPs for the user
            const deleteOtpQuery = 'DELETE FROM mfa_otps WHERE user_id = ?';
            db.query(deleteOtpQuery, [user.user_id], (err) => {
                if (err) {
                    console.error("Error deleting existing OTPs:", err);
                    return res.status(500).json({ Error: 'Error clearing old OTPs' });
                }

                // Generate a 6-digit OTP
                let otp;
                try {
                    otp = crypto.randomInt(100000, 999999).toString();
                } catch (err) {
                    console.error("Error generating OTP:", err);
                    return res.status(500).json({ Error: 'Error generating OTP' });
                }

                const otpHash = hashOtplogin(otp);
                const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

                const otpRecord = {
                    user_id: user.user_id,
                    email: email,
                    otp_hash: otpHash,


                };

                const createdAt = new Date();

                const insertOtpQuery = 'INSERT INTO mfa_otps (user_id,email, otp, created_at, expires_at) VALUES (?, ?, ?, ?,?)';
                db.query(insertOtpQuery, [otpRecord.user_id, otpRecord.email, otpRecord.otp_hash, createdAt, expiresAt], (err) => {
                    if (err) {
                        console.error("Error inserting OTP:", err);
                        return res.status(500).json({ Error: 'Error storing OTP' });
                    }

                    // Send the OTP via email
                    const mailOptions = {
                        from: process.env.EMAIL_USER, // Sender email
                        to: email,                   // Recipient email
                        subject: 'Your OTP Code',
                        text: `Your OTP code is ${otp}. It is valid for 3 minutes.`,
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error("Error sending email:", error);
                            return res.status(500).json({ Error: 'Error sending OTP email' });
                        }

                        console.log("Email sent:", info.response);
                        res.json({
                            Status: 'Success',
                            Message: 'OTP sent to your email. Please verify.',

                        });
                    });
                });
            });
        });
    });
});




// Verify OTP Route
app.post('/verify-otp-login', (req, res) => {
    const { email, otp } = req.body;

    // Query to fetch the latest OTP record for the given email
    const fetchOTPQuery = 'SELECT * FROM mfa_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1';

    db.query(fetchOTPQuery, [email], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ Error: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(400).json({ Error: 'No OTP request found for this email.' });
        }

        const otpRecord = results[0];
        const currentTime = new Date();

        // Ensure expires_at is a Date object and compare
        const expiresAt = new Date(otpRecord.expires_at); // Convert to Date object if it's a string or timestamp
        console.log('Current time:', currentTime);
        console.log('OTP expires at:', expiresAt);

        // Check if OTP has expired
        if (currentTime > expiresAt) {
            console.log('OTP has expired.');
            return res.status(400).json({ Error: 'OTP has expired.' });
        }

        // Compare the provided OTP with the stored hashed OTP
        bcrypt.compare(otp, otpRecord.otp, (err, isMatch) => {
            if (err) {
                console.error('Error verifying OTP:', err);
                return res.status(500).json({ Error: 'Error verifying OTP.' });
            }

            if (!isMatch) {
                return res.status(400).json({ Error: 'Invalid OTP.' });
            }

            // Generate JWT token
            const token = jwt.sign({ user_id: otpRecord.user_id, email: email }, process.env.SECRET_KEY, { expiresIn: '1h' });
            console.log('Generated token:', token); // Log the generated token

            // Set the token in an HTTP-only cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
                sameSite: 'Strict', // CSRF protection
            }).json({ Status: 'Login successful.', Token: token });
        });
    });
});


app.post('/resend-otp', async (req, res) => {
    const { email } = req.body; // Make sure user_id is provided or retrieved from session

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    // Step 1: Generate a new OTP
    let otp;
    try {
        otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
    } catch (err) {
        console.error("Error generating OTP:", err);
        return res.status(500).json({ Error: 'Error generating OTP' });
    }

    // Step 2: Hash the OTP
    const otpHash = hashOtplogin(otp);

    // Step 3: Set the OTP expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 5 minutes expiration

    // Step 4: Prepare the updated OTP data
    const updatedOtpRecord = {
        otp_hash: otpHash,
        expires_at: expiresAt,
        created_at: new Date() // Update the created_at timestamp with the current time
    };

    // Step 5: Update the OTP for the provided email
    const updateOtpQuery = 'UPDATE mfa_otps SET otp = ?, expires_at = ?, created_at = ? WHERE email = ?';
    db.query(updateOtpQuery, [updatedOtpRecord.otp_hash, updatedOtpRecord.expires_at, updatedOtpRecord.created_at, email], (err) => {
        if (err) {
            console.error("Error updating OTP:", err);
            return res.status(500).json({ Error: 'Error updating OTP' });
        }

        // Step 6: Send the new OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender email
            to: email,                   // Recipient email
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 3 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ Error: 'Error sending OTP email' });
            }

            console.log("Email sent:", info.response);
            res.json({
                Status: 'Success',
                Message: 'OTP sent to your email. Please verify.',
            });
        });
    });
});



// Forgot Password Route
app.post('/forgot-password', authLimiter, (req, res) => {
    const { email } = req.body;

    // Input Validation
    if (!email) {
        return res.status(400).json({ Error: 'Email is required.' });
    }

    // Check if the Email Exists in Users Table
    const userCheckQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(userCheckQuery, [email], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ Error: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ Error: 'Email not found.' });
        }

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = hashOtp(otp); // Hash the OTP for secure storage

        // Set OTP Expiration Time (10 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete Existing OTPs for the Email to Ensure Only One Active OTP
        const deleteExistingOTPs = 'DELETE FROM password_resets WHERE email = ?';
        db.query(deleteExistingOTPs, [email], (err, deleteResult) => {
            if (err) {
                console.error('Error Deleting Existing OTPs:', err);
                return res.status(500).json({ Error: 'Database error.' });
            }

            // Insert New OTP into password_resets Table
            const insertOTPQuery = 'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)';
            db.query(insertOTPQuery, [email, otpHash, expiresAt], (err, insertResult) => {
                if (err) {
                    console.error('Error Inserting OTP:', err);
                    return res.status(500).json({ Error: 'Database error.' });
                }

                // Send OTP via Email using Nodemailer
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Your Password Reset OTP',
                    text: `Your OTP for password reset is: ${otp}. It is valid for 5 minutes.`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error Sending Email:', error);
                        return res.status(500).json({ Error: 'Error sending email.' });
                    } else {
                        console.log('Email sent:', info.response);
                        return res.json({ Status: 'OTP sent to email.' });
                    }
                });
            });
        });
    });
});

// Verify OTP Route
app.post('/verify-otp', authLimiter, (req, res) => {
    const { email, otp } = req.body;

    // Input Validation
    if (!email || !otp) {
        return res.status(400).json({ Error: 'Email and OTP are required.' });
    }

    // Retrieve the Latest OTP for the Email
    const fetchOTPQuery = 'SELECT * FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1';
    db.query(fetchOTPQuery, [email], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ Error: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(400).json({ Error: 'No OTP request found for this email.' });
        }

        const resetRequest = results[0];
        const currentTime = new Date();

        // Check if OTP is Expired
        if (currentTime > resetRequest.expires_at) {
            return res.status(400).json({ Error: 'OTP has expired.' });
        }

        // Hash the Provided OTP to Compare with Stored Hash
        const providedOtpHash = hashOtp(otp);
        if (providedOtpHash !== resetRequest.otp) {
            return res.status(400).json({ Error: 'Invalid OTP.' });
        }

        return res.json({ Status: 'OTP verified successfully.' });
    });
});

// Reset Password Route
app.post('/reset-password',async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ Error: 'All fields are required.' });
    }

    // Retrieve the Latest OTP for the Email
    const fetchOTPQuery = 'SELECT * FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1';
    db.query(fetchOTPQuery, [email], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ Error: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(400).json({ Error: 'No OTP request found for this email.' });
        }

        const resetRequest = results[0];
        //const currentTime = new Date();

        // Check if OTP is Expired
        /*if (currentTime > resetRequest.expires_at) {
            return res.status(400).json({ Error: 'OTP has expired.' });
        }*/

        // Hash the Provided OTP to Compare with Stored Hash
        const providedOtpHash = hashOtp(otp);
        if (providedOtpHash !== resetRequest.otp) {
            return res.status(400).json({ Error: 'Invalid OTP.' });
        }

        // Retrieve the User's Current Password
        const fetchPasswordQuery = 'SELECT password FROM users WHERE email = ?';
        db.query(fetchPasswordQuery, [email], (err, userResults) => {
            if (err) {
                console.error('Database Error:', err);
                return res.status(500).json({ Error: 'Database error.' });
            }

            if (userResults.length === 0) {
                return res.status(400).json({ Error: 'User not found.' });
            }

            const currentPasswordHash = userResults[0].password;

            // Compare the New Password with the Old Password
            bcrypt.compare(newPassword, currentPasswordHash, (err, isSame) => {
                if (err) {
                    console.error('Error Comparing Passwords:', err);
                    return res.status(500).json({ Error: 'Error processing password.' });
                }

                if (isSame) {
                    return res.status(400).json({
                        Error: 'Your password is the same as the previous password. Please set a new password.',
                    });
                }

                // Hash the New Password
                bcrypt.hash(newPassword, saltRounds, (err, hash) => {
                    if (err) {
                        console.error('Error Hashing New Password:', err);
                        return res.status(500).json({ Error: 'Error processing password.' });
                    }

                    // Update the User's Password in the Database
                    const updatePasswordQuery = 'UPDATE users SET password = ? WHERE email = ?';
                    db.query(updatePasswordQuery, [hash, email], (err, updateResult) => {
                        if (err) {
                            console.error('Error Updating Password:', err);
                            return res.status(500).json({ Error: 'Database error.' });
                        }

                        // Check if the update affected any rows
                        if (updateResult.affectedRows > 0) {
                            return res.status(200).json({ success: true, message: 'Password updated successfully.' });
                        } else {
                            return res.status(400).json({ Error: 'No user found with the provided email.' });
                        }
                    });
                });
            });
        });
    });
});


// Verify Token Middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(403).json({ Error: 'Token missing, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token Verification Error:', err);
        return res.status(401).json({ Error: 'Invalid or expired token.' });
    }
};

// Token Verification Route
app.get('/verifyToken', verifyToken, (req, res) => {
    return res.json({ Status: 'Success', decoded: req.user });
});

// Protected Route (Homepage)
app.get('/homepage', verifyToken, (req, res) => {
    return res.json({
        message: 'Welcome to the homepage!',
        user: req.user,
    });
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper Functions for Encryption/Decryption
const hashKey = (key) => {
    return crypto.createHash("sha256").update(key).digest(); // Hash the key with SHA-256
};

// Encrypt function: Encrypts data using AES-256-CBC
const encrypt = (data, key, iv) => {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
};

// Decrypt function: Decrypts data using AES-256-CBC
const decrypt = (data, key, iv) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
};

// File Upload Route
// File Upload Route with User ID



// Handle the file upload and processing
app.post("/upload", upload.single("file"), async (req, res) => {
    const token = req.cookies.token; // Assuming token is stored in cookies
    console.log("token", token);
    if (!token) {
        return res.status(403).json({ message: "User not authenticated" });
    }

    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
        if (err) {
            console.error("JWT verification error:", err);
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        console.log("Decoded Token:", decoded);
        const userId = decoded.user_id; // Extract userId from the decoded token
        console.log("User ID:", userId);
        if (!userId) {
            return res.status(400).json({ message: "User ID missing from token" });
        }

        const userKey = req.body.key;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        if (!userKey || userKey.length < 8) {
            return res.status(400).json({ message: "Encryption key must be at least 8 characters long" });
        }

        try {
            // Check the upload limit for the user
            const countQuery = `
                SELECT COUNT(*) AS uploadCount 
                FROM user_files 
                WHERE user_id = ? AND DATE(created_at) = CURDATE()`;
            const [result] = await db.promise().query(countQuery, [userId]);
            const uploadCount = result[0].uploadCount;

            if (uploadCount >= 5) {
                return res.status(400).json({ message: "You can only upload up to 5 files per day" });
            }

            // Process the file using Python Flask app
            const formData = new FormData();
            formData.append("file", file.buffer, { filename: file.originalname });

            const response = await axios.post("http://127.0.0.1:5000/process_file", formData, {
                headers: formData.getHeaders(),
            });

            const processedData = response.data; // Processed data from Python app
            const processedDataBuffer = Buffer.from(processedData.replace(/\r\n/g, "\n"), "utf-8");
            //console.log("processedData:",processedData);
            // Encrypt the processed data
            const hashedKey = hashKey(userKey);
            const iv = crypto.randomBytes(16);
            const encryptedData = encrypt(processedDataBuffer, hashedKey, iv);

            // Save the encrypted file to the database
            const fileId = uuidv4();
            const insertQuery = `
                INSERT INTO user_files (file_id, user_id, file_name, file_data, iv, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())`;

            await db.promise().query(insertQuery, [fileId, userId, file.originalname, encryptedData, iv]);

            res.status(200).json({
                message: "File uploaded, processed, and encrypted successfully",
                fileId,
                fileName: file.originalname,
            });
        } catch (error) {
            console.error("Error:", error.message);
            res.status(500).json({ message: "Server error" });
        }
    });
});


// Endpoint to mask unencrypted file
app.post("/mask", async (req, res) => {
    const userKey = req.body.key;
    const fileId = req.body.fileId;
    const columnsToMask = req.body.columnsToMask;

    // Log the columnsToMask for debugging
    console.log("Received columnsToMask:", columnsToMask);

    if (!fileId) {
        return res.status(400).send({ message: "File ID is required" });
    }

    if (!userKey || userKey.length < 8) {
        return res.status(400).send({ message: "Decryption key must be at least 8 characters long" });
    }

    const hashedKey = hashKey(userKey);

    const queryFetch = "SELECT file_id, file_data, iv FROM user_files WHERE file_id = ? LIMIT 1";

    db.query(queryFetch, [fileId], async (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send({ message: "Failed to fetch file data" });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: "No file found with the given ID" });
        }

        const { file_id, file_data, iv } = results[0];
        let decryptedContent;

        try {
            decryptedContent = decrypt(file_data, hashedKey, iv);
        } catch (err) {
            console.error("Decryption failed:", err);
            return res.status(400).send({ message: "Invalid decryption key" });
        }
        console.log("DecryptedContent to mask", decryptedContent);
        try {
            // Send the decrypted content to the Flask API
            const flaskResponse = await axios.post(
                "http://localhost:5000/apply_masking_rules",
                {
                    content: decryptedContent,
                    columnsToMask: columnsToMask // Include the columnsToMask in the request body
                },
                { headers: { "Content-Type": "application/json" } }
            );
            //console.log("Flask Response:", flaskResponse.data);

            const maskedContent = flaskResponse.data.maskedContent; // Assume Flask sends this key
            console.log("MaskedContent", maskedContent);
            const readableStream = new stream.Readable();
            readableStream.push(maskedContent);
            readableStream.push(null);

            const rows = [];
            const headers = [];

            readableStream
                .pipe(csvParser())
                .on("headers", (headerArray) => {
                    headers.push(...headerArray);
                })
                .on("data", (row) => {
                    rows.push(Object.values(row));
                })
                .on("end", () => {
                    console.log("Headers:", headers);
                    console.log("Rows:", rows);

                    const queryUpdate = "UPDATE user_files SET masked_data = ? WHERE file_id = ?";
                    db.query(queryUpdate, [Buffer.from(maskedContent, "utf8"), file_id], (updateErr) => {
                        if (updateErr) {
                            console.error(updateErr);
                            return res.status(500).send({ message: "Failed to save masked data" });
                        }
                        res.send({ content: maskedContent, message: "Masked data saved successfully" });
                    });
                })
                .on("error", (err) => {
                    console.error(err);
                    res.status(500).send({ message: "Failed to process masked data" });
                });
        } catch (error) {
            console.error("Error calling Flask API:", error);
            res.status(500).send({ message: "Failed to apply masking rules" });
        }
    });
});

// Masking rules (unchanged)
const applyMaskingRules = (headers, rows) => {
    const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
    return rows.map((row) => {
        return normalizedHeaders.map((header, index) => {
            let cell = row[index];
            switch (header) {
                case "ic number":
                    cell = cell ? cell.replace(/^(\d{6}).*$/, "$1******") : cell;
                    break;
                case "home address":
                    cell = "Address Hidden";
                    break;
                case "phone number":
                    cell = cell ? cell.replace(/(\d{3})\d+/g, (match, p1) => p1 + "-******") : cell;
                    break;
                case "email":
                    cell = cell ? cell.replace(/^(.).*?(@.*)$/, "$1****$2") : cell;
                    break;
                case "place of birth":
                    cell = "Place Hidden";
                    break;
                case "parent salary (rm)":
                    if (cell) {
                        const lowerBound = Math.floor(cell / 1000) * 1000;
                        const upperBound = lowerBound + 1000;
                        cell = `RM ${lowerBound}-${upperBound}`;
                    }
                    break;
                default:
                    break;
            }
            return cell;
        });
    });
};
app.post('/generate-signature', async (req, res) => {
    const { fileContent, fileId } = req.body; // Get the file content and fileId from the frontend

    if (!fileId) {
        return res.status(400).send({ message: "File ID is required" });
    }

    const { signature, randomNumber } = await generateDigitalSignature(fileContent);

    // Store the signature and hashed random number in the database
    storeSignatureInDB(fileId, signature, randomNumber);

    // Send the signature back in the response
    res.json({ signature });
});

const generateDigitalSignature = async (fileContent) => {
    const secretKey = process.env.SECRET_KEY;

    // Generate a random number
    const randomNumber = Math.random().toString(36).substring(2, 15);
    console.log("random_number:", randomNumber);
    // Combine file content, random number, and secret key for uniqueness
    const uniqueData = `${fileContent}-${randomNumber}-${secretKey}`;

    // Generate HMAC with SHA-256
    const signature = crypto.createHmac('sha256', secretKey)
        .update(uniqueData)
        .digest('base64'); // Return the hash as a base64 string

    // Hash the random number with bcrypt


    return { signature, randomNumber };
};

const storeSignatureInDB = (fileId, signature, randomNumber) => {
    const query = 'UPDATE user_files SET digital_signature = ?, random_number = ? WHERE file_id = ?';

    db.query(query, [signature, randomNumber, fileId], (error, results) => {
        if (error) {
            console.error('Error updating the signature and hashed random number:', error);
        } else {
            console.log('Signature and hashed random number updated successfully');
        }
    });
};

app.post('/verify-signature', async (req, res) => {
    const { fileContent, signature: extractedSignature, fileId } = req.body;

    // Log the file content to console
    console.log("Received file content:", fileContent);

    console.log("Received signature:", extractedSignature);

    try {
        const queryFetch = "SELECT digital_signature, random_number FROM user_files WHERE file_id = ? LIMIT 1";

        db.query(queryFetch, [fileId], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send({ message: "Failed to fetch file data" });
            }

            if (results.length === 0) {
                console.warn('No file found with the given ID');
                return res.status(404).send({ message: "No file found with the given ID" });
            }

            const { digital_signature, random_number } = results[0];

            // Compare the extracted signature with the stored signature
            if (digital_signature !== extractedSignature) {
                return res.status(400).json({ message: 'Digital signature does not match.' });
            }

            // Generate and verify the original signature using the file content and random number
            const secretKey = process.env.SECRET_KEY;
            const uniqueData = `${fileContent}-${random_number}-${secretKey}`;
            const generatedSignature = crypto
                .createHmac('sha256', secretKey)
                .update(uniqueData)
                .digest('base64');

            console.log(generatedSignature);

            if (generatedSignature !== digital_signature) {
                return res.status(400).json({ message: 'File content or random number tampered.' });
            }

            return res.status(200).json({ isValid: true, message: 'Signature is valid.' });
        });
    } catch (error) {
        console.error('Error verifying signature:', error);
        return res.status(500).json({ message: 'Server error.' });
    }
});

app.post("/file", (req, res) => {
    const { decryptionKey, fileId } = req.body; // Access data from the request body
    console.log("Received decryption key:", decryptionKey);

    if (!decryptionKey || decryptionKey.length < 8) {
        return res.status(400).send({ message: "Decryption key must be at least 8 characters long" });
    }

    const hashedKey = hashKey(decryptionKey); // Hash the user-provided key
    const queryFetch = "SELECT file_id, file_data, iv FROM user_files WHERE file_id = ? LIMIT 1";

    db.query(queryFetch, [fileId], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ message: "Failed to fetch file data" });
        }

        if (results.length === 0) {
            console.warn('No file found with the given ID');
            return res.status(404).send({ message: "No file found with the given ID" });
        }

        const { file_id, file_data, iv } = results[0];
        console.log("File id:", file_id);
        console.log("Fetched IV:", iv);
        console.log("Fetched file data from database:", file_data);

        let decryptedContent;
        try {
            decryptedContent = decrypt(file_data, hashedKey, iv);
        } catch (err) {
            console.error("Decryption failed:", err);
            return res.status(400).send({ message: "Invalid decryption key" });
        }

        if (!decryptedContent || decryptedContent.trim() === "") {
            console.error("Decrypted content is empty");
            return res.status(400).send({ message: "Decrypted content is empty" });
        }

        console.log("Decrypted content to unmask:", decryptedContent);
        try {
            const form = new FormData();
            form.append("file", Buffer.from(decryptedContent), {
                filename: `decrypted_file.csv`,
                contentType: "text/csv",
            });

            const response = await axios.post("http://127.0.0.1:5000/deProcessFile", form, {
                headers: form.getHeaders(),
            });

            const decipherData = response.data;
            if (!decipherData) {
                console.error("Flask returned empty or invalid data");
                return res.status(500).send({ message: "Failed to receive valid data from Flask" });
            }

            //console.log("Deciphered data:", decipherData);
            res.send({ content: decipherData, message: "Successfully unmasked the data" }); // Send Flask's response back to the client
        } catch (axiosError) {
            console.error("Error sending data to Flask:", axiosError.message);
            res.status(500).send({ message: "Failed to process the file with Flask" });
        }
    });
});
app.post('/verify-captcha', async (req, res) => {
    const { captchaValue, decryptionKey } = req.body; // Access from body


    // 1. Verify CAPTCHA with Google reCAPTCHA API
    try {
        const verificationResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY, // Your secret key
                    response: captchaValue, // Pass the captcha value here
                }
            }
        );

        if (!verificationResponse.data.success) {
            return res.status(400).json({ success: false, message: 'CAPTCHA verification failed.' });
        }

        // If CAPTCHA verification is successful
        res.status(200).json({ success: true, message: 'CAPTCHA verified successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error verifying CAPTCHA.' });
    }
});
app.delete("/deleteFile", async (req, res) => {
    const { id } = req.body;
    console.log("id:",id);
  
    if (!id) {
      return res.status(400).json({ message: "File ID is required." });
    }
  
    try {
      // Define the SQL query
      const queryFetch = "DELETE FROM user_files WHERE file_id = ?";
  
      // Execute the query with the provided file ID
      db.query(queryFetch, [id], (err, results) => {
        if (err) {
          console.error("Error deleting file from database:", err);
          return res.status(500).json({ message: "An error occurred while deleting the file." });
        }
  
        // Check if any rows were affected
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: "File not found." });
        }
  
        res.status(200).json({ message: "File deleted successfully." });
      });
    } catch (error) {
      console.error("Error deleting file from database:", error);
      res.status(500).json({ message: "An error occurred while deleting the file." });
    }
  });
  
  
  
// POST route for sending email
app.post('/send-feedback', async (req, res) => {
    const { name, email, message } = req.body;
  
    try {
      

      // Email to the user
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank You for Your Feedback!',
        text: `Hello ${name},\n\nThank you for reaching out! We have received your message:\n\n"${message}"\n\nOur team will get back to you shortly.\n\nBest regards,\n[SecurMask]`,
      };
  
      // Send Email
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });


// Logout Route
app.post('/logout', (req, res) => {
    console.log('Logout request received.');

    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 0,
    });

    return res.json({ Status: 'Logged out successfully.' });
});

// Start Server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
