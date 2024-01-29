const verifyToken = (req, res, next) => {
 
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Token missing' });
    }
  
    jwt.verify(token,'shivu264', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
  
      req.userid = decoded.userid;
  
      next();
    });
  };
export default verifyToken  