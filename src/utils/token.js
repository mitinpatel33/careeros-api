const jwt = require('jsonwebtoken');

exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m',
    },
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
    },

    process.env.JWT_REFRESH_SECRET,

    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d',
    },
  );
};
