const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true },

  username: { type: String, unique: true, trim: true },
  phoneNumber: { type: String, trim: true },

  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
    },
    twoFactorEnabled: { type: Boolean, default: false },
  },

  lastLogin: { type: Date },
  accountStatus: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
}, { timestamps: true });

// Hash password before saving if it is new or modified
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 10; // Adjust cost factor as needed
    const hashed = await bcrypt.hash(this.password, saltRounds);
    this.password = hashed;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password input with stored hash
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
