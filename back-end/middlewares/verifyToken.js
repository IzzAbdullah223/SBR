import jwt from 'jsonwebtoken';
// ── VERIFY TOKEN ───────────────────────────────────────────────────────────
// middleware that protects routes — must be logged in to continue
// usage: router.get('/protected-route', verifyToken, routeHandler)

const verifyToken = (req, res, next) => {

  // frontend must send every protected request with this header:
  // Authorization: Bearer eyJhbGc...
  const bearerHeader = req.headers['authorization'];

  // no header at all — not logged in
  if (!bearerHeader) return res.status(403).json({ error: 'No token provided' });

  // split "Bearer eyJhbGc..." into ["Bearer", "eyJhbGc..."] and take the token part
  const token = bearerHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Invalid token format' });

  // verify the token using the same secret key it was signed with
  // checks: was it created by us? has it expired? was it tampered with?
  jwt.verify(token, process.env.JWT_SECRET, (err, authData) => {

    // token is invalid or expired — block the request
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    // token is valid — put the decoded user data on req.user
    // route handler can now use req.user.id to know who is making the request
    req.user = authData.user;

    // continue to the actual route handler
    next();
  });
};

export default verifyToken;