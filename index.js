import express from 'express'
import prisma from './prisma1.js'
import bcrypt, { hash } from 'bcrypt'
import jwt from "jsonwebtoken"
import { storage, ref, deleteObject, uploadBytesResumable, getDownloadURL } from "./firebase-setup/firebase.js"
import bodyParser from 'body-parser'
import multer from 'multer';
import giveCurrentDateTime from "./helpers/currentdatetime.js"
import verifyToken from './middleware/authmiddleware.js'





const app = express()
const port = 3000
app.use(bodyParser.json());


const upload = multer({ storage: multer.memoryStorage() });

app.post('/uploadthumbnail', upload.single('thumbnailimage'), async (req, res) => {
  try {
    const dateTime = giveCurrentDateTime();
    const storageRef = ref(storage, `Images-Media/${req.file.originalname} ${dateTime}`);

    const metadata = {
      contentType: req.file.mimetype,
    };

    const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('File successfully uploaded.');
    return res.send({
      message: 'Thumbnail Image Uploaded !',
      name: req.file.originalname,
      type: req.file.mimetype,
      downloadURL,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send(error.message);
  }
});



app.post("/uploadimage", upload.array("images"), async (req, res) => {
  try {
      const dateTime = giveCurrentDateTime();
      const uploadPromises = [];
      req.files.forEach(file=>{ const storageRef = ref(storage,`Images-Media/${file.originalname + "       " + dateTime}`);

      const metadata = {
          contentType: file.mimetype,
      };
      const uploadPromise = uploadBytesResumable(storageRef, file.buffer, metadata)
      .then(snapshot => getDownloadURL(snapshot.ref));

      uploadPromises.push(uploadPromise);
    
    })
     const downloadUrls = await Promise.all(uploadPromises)


      console.log('File successfully uploaded.');
      return res.send({
        message: 'Images Uploaded',
        files: req.files.map((file, index) => ({
          name: file.originalname,
          type: file.mimetype,
          downloadURL:downloadUrls[index]
        }))
      });
  } catch (error) {
      return res.status(400).send(error.message)
  }
});

app.post("/deleteimage",async (req,res)=>{
  const downloadUrl=req.body.downloadUrl
  try {await deleteImage(downloadUrl)
    res.send({"message":"Succesfully Deleted Image !"})
  }
  catch (e){
    res.status(400).send({"message":e})
  }
})

app.post("/deletethumbnail",async (req,res)=>{
  const downloadUrl=req.body.downloadUrl
  try {await deleteImage(downloadUrl)
  res.send({"message":"Succesfully Deleted Thumbnail !"})
  }
  catch (e){
    res.status(400).send({"message":e})
  }
})







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


//Create a Blog
app.post('/createpost',async (req,res)=>{
  const images = req.body.images
 try{ 
  const post =await prisma.post.create({
    data:{
      Title:req.body.title,
      Content:req.body.content,
      ThumbnailImage:req.body.thumbnail,
      images:{
        create:images.map(image=>(
{ filename: image.name,
  downloadUrl: image.downloadURL,}
        )
        )
      },
    }
  })
res.send({"message":"Post Created Succesfully !",
"id":post.id
})
}
catch (e){
  res.status(400).send({message:e.message})
}
})

//View all Blogs

app.get("/viewposts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        Title: true,
        Content: true,
        ThumbnailImage: true,
        createdAt: true,
      },
    });

    res.send(posts);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error '+error });
  }
});
//View all Blogs

//View a Blog
app.post("/viewpost", async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
    where:{
      id:req.body.id
    },
    include:{
      images:true
    }
    });
    if(!post){return  res.status(400).send({ message: 'Post not Found'});}
    res.send(post);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error '+error });
  }
});

//View a Blog



//Edit a Blog
app.post('/editpost',async (req,res)=>{

 try {
  const images=req.body.images
  const existingPost = await prisma.post.findUnique({
    where: { id: req.body.id },
  });

  if (!existingPost) {
    return res.status(404).send({ message: 'Post not found' });
  }
  const postData = {
    Title: req.body.title || existingPost.Title,
    Content: req.body.content || existingPost.Content,
    ThumbnailImage: req.body.thumbnail || existingPost.ThumbnailImage,
  }
  if (images && images.length > 0) {
    postData.images = {
      create: images.map((image) => ({
        filename: image.name,
        downloadUrl: image.downloadURL,
      })),
    };
  }

  const updatedPost = await prisma.post.update({
    where: { id: req.body.id},
    data: postData,
  });

  res.send({ message: 'Post updated successfully', updatedPost });
} catch (error) {
  res.status(500).send({ message: 'Internal Server Error', error: error.message });
}

})


//Edit a Blog




//Delete a Blog
async function deleteImages(images) {
  const deletePromises = [];

  for (const image of images) {
    if (!image) {
      throw new Error('Missing images');
    }
    const filePath = await getDownloadURL(ref(storage, image.downloadUrl));
    const fileRef = ref(storage,filePath);

    const deletePromise = deleteObject(fileRef);
    deletePromises.push(deletePromise);
  }

  try {
    await Promise.all(deletePromises);
    console.log('Files successfully deleted.');
  } catch (error) {
    console.error('Error deleting files:', error);
    throw new Error('Error deleting files '+error);
  }
}


  async function deleteImage(downloadUrl) {  
    try {
      const filePath = await getDownloadURL(ref(storage,downloadUrl));
      const fileRef = ref(storage,filePath);
      await deleteObject(fileRef);
      
    
    } catch (error) {
      console.error('Error deleting files:', error);
      throw new Error('Error deleting files '+error);
    }
  }
  
  async function deletethumbnail(downloadUrl) {  
    const filePath = await getDownloadURL(ref(storage, downloadUrl));
    const fileRef = ref(storage,filePath);
    try {
     
      await deleteObject(fileRef);
      
    
    } catch (error) {
      console.error('Error deleting files:', error);
      throw new Error('Error deleting files '+error);
    }
  }
  



app.post("/deletepost",async(req,res)=>{
try{
  const existingPost = await prisma.post.findUnique({
    where: { id: req.body.id},
  });

  if (!existingPost) {
    return res.status(404).send({ message: 'Post not found' });
  }
  const images=await prisma.image.findMany({
    where: { postId: existingPost.id },
  })
  const thumbnailurl=existingPost.ThumbnailImage
  try {
    await deleteImages(images);
    await deletethumbnail(thumbnailurl)
  } catch (deleteImagesError) {
    console.error('Error deleting images:', deleteImagesError.message);
  }
  await prisma.image.deleteMany({
    where: { postId: existingPost.id },
  });

  await prisma.post.delete({
    where: { id: req.body.id},
    include: { images: true },
  });

  res.send({ message: 'Post and associated images deleted successfully' });
}
catch (e){
  res.status(400).send({message:e.message})
}
})
// 


//Edit a Blog











export default app;