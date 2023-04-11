const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true },
    username: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    name: {
      firstName: String,
      lastName: String,
    },
    address: String,
    regularUser: {
      isRegular: { type: Boolean, required: true, default: false },
      discount: { type: Number, required: true, default: 0 },
    },
    isAdmin: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
  },
  { collection: 'users', timestamps: { createdAt: true, updatedAt: true } },
);

// has user password before save
userSchema.pre('save', function (next) {
  const user = this;

  if (user.isModified('password')) {
    bcryptjs.genSalt(10, (error, salt) => {
      if (error) return next(error);

      bcryptjs.hash(user.password, salt, (error, hashedPassword) => {
        if (error) return next(error);
        user.password = hashedPassword;
        return next();
      });
    });
  } else {
    return next();
  }
});

// compare user password before login
userSchema.methods.comparePasswords = function (password, next) {
  bcryptjs.compare(password, this.password, function (error, isMatch) {
    next(error, isMatch);
  });
};

mongoose.model('user', userSchema);
