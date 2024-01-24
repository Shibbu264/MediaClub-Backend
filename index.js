import express from 'express'
import prisma from './prisma.js'
const app=express()
const port = 3000

app.get('/',(req,res)=>{
res.send("<h1>Hello World !</h1>")
})

app.listen(port,()=>{
    console.log("Server chal rha hai !")
})


app.post("/users", async (req, res) => {
    try {
  
      const newUser = await prisma.admin.create({
        userid:"Media2024",
        password:"Tshirtstrip123"
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
