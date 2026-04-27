import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {

  const bearerHeader = req.headers['authorization'];

  if (!bearerHeader)
    return res.status(403).json({ error: 'No token provided' });

  const token = bearerHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Invalid token format' });

  // checks: was it created by us? has it expired? was it tampered with?
  jwt.verify(token, process.env.JWT_SECRET, (err, authData) => {
    // token is invalid or expired — block the request
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    req.user = authData.user; //decode the payload if valid

    next();
  });
};

export default verifyToken;
