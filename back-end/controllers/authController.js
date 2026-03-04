import jwt from 'jsonwebtoken';

export const loginPost = (req, res) => {
  const user = req.user;
  jwt.sign(
    { user: { id: user._id, email: user.email } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
    (err, token) => {
      if (err) return res.status(500).json({ message: 'Token generation failed' });
      res.json({ token });
    }
  );
};

export const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) return res.status(403).json({ error: 'No token provided' });

  const token = bearerHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Invalid token format' });

  jwt.verify(token, process.env.JWT_SECRET, (err, authData) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = authData.user;
    next();
  });
};