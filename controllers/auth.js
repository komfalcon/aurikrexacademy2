const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// Helper function to find user
async function findUser(email) {
  const users = await getUsers();
  return users.find((u) => u.email === email);
}

// Helper function to find user by id
async function findUserById(id) {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

// Helper function to save user
async function saveUser(user) {
  const users = await getUsers();
  const existingIndex = users.findIndex((u) => u.email === user.email);
  if (existingIndex !== -1) {
    users[existingIndex] = { ...users[existingIndex], ...user };
  } else {
    users.push(user);
  }
  await saveUsers(users);
}

// Register
exports.register = async (req, res) => {
  const {
    fullName,
    email,
    password,
    confirmPassword,
    role,
    phone,
    gender,
    dob,
    school,
    classLevel,
  } = req.body;
  if (!fullName || !email || !password || !confirmPassword || !role)
    return res
      .status(400)
      .json({
        message:
          "Required fields: fullName, email, password, confirmPassword, role.",
      });
  if (!["student", "tutor"].includes(role))
    return res.status(400).json({ message: "Role must be student or tutor." });
  if (password.length < 12)
    return res
      .status(400)
      .json({ message: "Password must be at least 12 characters." });
  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{12,}$/.test(
      password
    )
  )
    return res
      .status(400)
      .json({
        message:
          "Password must include: 1 uppercase, 1 lowercase, 1 number, 1 special character.",
      });
  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match." });

  try {
    const existingUser = await findUser(email);
    if (existingUser)
      return res.status(409).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = Math.floor(
      10000000 + Math.random() * 90000000
    ).toString();

    const userData = {
      id: Date.now().toString(),
      fullName,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      gender: gender || "",
      dob: dob ? new Date(dob).toISOString() : null,
      school: school || "",
      classLevel: classLevel || "",
      verified: false,
      verificationCode,
      codeSentAt: new Date().toISOString(),
      subjects: [],
    };

    await saveUser(userData);

    // Send verification email
    let emailSent = false;
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Aurikrex Academy Account",
        text: `Your verification code is: ${verificationCode}\n\nEnter this code on the verification page to activate your account.\n\nThis code expires in 10 minutes.`,
        html: `<h2>Verify Your Email</h2><p>Your verification code is: <strong>${verificationCode}</strong></p><p>Enter this code to activate your account.</p><p>This code expires in 10 minutes.</p>`,
      });

      emailSent = true;
      console.log(`Verification email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(
        `Failed to send verification email to ${email}:`,
        emailError.message || emailError
      );
    }

    res.status(201).json({
      message:
        "Registration successful. Please check your email for the verification code.",
      emailSent,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required." });

  try {
    const user = await findUser(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials." });
    if (!user.verified)
      return res
        .status(401)
        .json({ message: "Please verify your email first." });

    // FIX: include email in token payload
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        school: user.school || "",
        subjects: user.subjects || [],
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const {
      fullName,
      gender,
      dob,
      phone,
      address,
      guardianName,
      guardianPhone,
      school,
      classLevel,
      subjects,
      bio,
      profilePicture,
    } = req.body;
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.fullName = fullName || user.fullName;
    user.gender = gender || user.gender;
    user.dob = dob || user.dob;
    user.phone = phone || user.phone;
    user.address = address || user.address || "";
    user.guardianName = guardianName || user.guardianName || "";
    user.guardianPhone = guardianPhone || user.guardianPhone || "";
    user.school = school || user.school;
    user.classLevel = classLevel || user.classLevel;
    user.subjects = subjects || user.subjects || [];
    user.bio = bio || user.bio || "";
    user.profilePicture = profilePicture || user.profilePicture || "";

    await saveUser(user);

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        school: user.school,
        subjects: user.subjects,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error during profile update." });
  }
};

// Get current user
exports.me = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        school: user.school || "",
        subjects: user.subjects || [],
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: "Server error fetching user." });
  }
};

// Logout (client-side)
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully. Client should clear token." });
};

// Verify email with token
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "Token required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id); // safer to use ID instead of email
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.verified) {
      return res.status(200).json({ message: "Account already verified." });
    }
    user.verified = true;
    user.verificationCode = null;
    user.codeSentAt = null;
    await saveUser(user);
    res.json({ message: "Email verified successfully." });
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};

// Verify code
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: "Email and code required." });
  }
  try {
    const user = await findUser(email);
    if (!user || user.verificationCode !== code) {
      return res.status(404).json({ message: "Invalid code." });
    }
    if (user.verified) {
      return res.status(200).json({ message: "Account already verified." });
    }
    if (Date.now() - new Date(user.codeSentAt) > 10 * 60 * 1000) {
      return res
        .status(400)
        .json({
          message: "Verification code expired. Please request a new one.",
        });
    }
    user.verified = true;
    user.verificationCode = null;
    user.codeSentAt = null;
    await saveUser(user);
    res.json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Verify code error:", err);
    res.status(500).json({ message: "Server error during verification." });
  }
};

// Resend code
exports.resendCode = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email required." });
  }
  try {
    const user = await findUser(email);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.verified) {
      return res.status(400).json({ message: "Account already verified." });
    }

    const verificationCode = Math.floor(
      10000000 + Math.random() * 90000000
    ).toString();
    user.verificationCode = verificationCode;
    user.codeSentAt = new Date().toISOString();

    await saveUser(user);

    // Send email
    let emailSent = false;
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Aurikrex Academy Account",
        text: `Your verification code is: ${verificationCode}\n\nEnter this code on the verification page to activate your account.\n\nThis code expires in 10 minutes.`,
        html: `<h2>Verify Your Email</h2><p>Your verification code is: <strong>${verificationCode}</strong></p><p>Enter this code to activate your account.</p><p>This code expires in 10 minutes.</p>`,
      });

      emailSent = true;
      console.log(`Resend verification email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(
        `Failed to resend verification email to ${email}:`,
        emailError.message || emailError
      );
    }

    res.json({
      message: "Verification code resent. Please check your email.",
      emailSent,
    });
  } catch (err) {
    console.error("Resend code error:", err);
    res.status(500).json({ message: "Server error resending code." });
  }
};
