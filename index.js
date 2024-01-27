import express from 'express'
import prisma from './prisma1.js'
import bcrypt, { hash } from 'bcrypt'
import jwt from "jsonwebtoken"

import bodyParser from 'body-parser'

const app = express()
const port = 3000
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.send("<h1>Hello World !</h1>")
})

app.listen(port, () => {
  console.log("Server chal rha hai !")
})

app.post("/createuser", async (req, res) => {
  try {
    const hashedpswd = await bcrypt.hash(req.body.password, 10)
    const newUser = await prisma.admin.create({
      data: {
        userid: req.body.userid,
        password: hashedpswd
      }
    })
    console.log(newUser)
    res.json(newUser)
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: "Internal Server Error",
    })
  }
})

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


app.get('/protected', verifyToken, async (req, res) => {
  res.json({ message: `Welcome, ${req.body.userid}! This is a protected route.` });
});




app.post('/login', async (req, res) => {

  try {
    const userid = await req.body.userid
    const password = await req.body.password

    const user = await prisma.admin.findUnique({
      where: {
        userid: userid,
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Authentication failed, Invalid User" });
    }

    const passwordmatch = await bcrypt.compare(password, user.password)

    if (passwordmatch) {
      const token = jwt.sign({ user }, 'shivu264', { expiresIn: '12h' })
      res.json({ token: token })
    }
    else {
      res.status(401).json({ message: "Authentication Failed!, Invalid Password!" })
    }





  }
  catch (error) {
    res.status(500).json({
      message: "Internal Server Error: " + error,
    });
  }

})


