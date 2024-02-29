const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

// routes

router.get('', async (req, res) => {

    try {
      const locals = {
        title: "NodeJs Blog",
        description: "Simple Blog created with NodeJs, Express & MongoDb."
    }
    const featuredPost = await Post.findOne().sort({ createdAt: -1 }).limit(1);
    let perPage = 10;
    let page = req.query.page || 1;
    const data = await Post.aggregate([ { $sort: { createdAt: -1} } ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();
    const count = await Post.countDocuments();

    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render('index', {
      locals, 
      data,
      featuredPost,
      current: page,
      nextPage: hasNextPage ? nextPage : null
    });
  
    }catch(error)
    {
      console.log(error);
    }

});


// GetPost : Id

router.get('/blogpost/:id', async (req, res) => {

  try{
    const locals = {
      title: "data title",
      description: ""
    }
     
    let slug = req.params.id;

    const data = await Post.findById(slug);
    res.render('blogpost', {locals, data});
  } catch (error)
  {
    console.log(error);
    res.status(500).send('Internal Server Error')
  }
})


// router.get('', async (req, res) => {

//   try {
//     const locals = {
//       title: "NodeJs Blog",
//       description: "Simple Blog created with NodeJs, Express & MongoDb."

//   }
  
//     const data = await Post.find().sort({createdAt: -1});
    // const featuredPost = await Post.findOne().sort({ createdAt: -1 }).limit(1);
//     const dataWithoutFeaturedPost = data.filter(post => post._id.toString() !== featuredPost._id.toString());
//     res.render('index', { locals, data:dataWithoutFeaturedPost, featuredPost });

    
//   }catch(error)
//   {
//     console.log(error);
//   }

// });

function insertPostData () {
    Post.insertMany([
        {
            title: "Building a new mern app",
            body: "Testing",
            imageURL:"https://raw.githubusercontent.com/imkishan1/imagestore/04adc5e60cbbf25e666a9bb763e5f9e265c84028/images/Snap.png"
        }
    ])
}

// insertPostData();

router.get('/about',(req,res) => {
    const locals = {
        title: "About Page",
        description: "About Blogger.com | What we do | How it works."
    }
    res.render('about', locals);
})

router.get('/post',(req,res) => {
  const locals = {
      title: "Create a post",
      description: "About Blogger.com | What we do | How it works."
  }
  res.render('post', locals);
})

router.get('/contact', (req, res) => {
    const locals = {
        title: "Contact Us",
        description: "This is contact us page."
    }

    res.render('contacts',locals);
})



// Connect to MongoDB using your MongoDB URI
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/post', upload.single('image'), async (req, res) => {
  try {
    const uploadedImagePath = 'public/uploads/' + req.file.filename;

    // Commit and push changes to GitHub
    const githubImageUrl = await commitAndPushToGitHub(uploadedImagePath);
    console.log('GitHub Image URL:', githubImageUrl);
    // Save post data including the GitHub URL in MongoDB
    const newPost = new Post({
      title: req.body.title,
      body: req.body.body,
      imageURL: githubImageUrl,
    });
    console.log('New Post Object:', newPost);
    await newPost.save();

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing the request.');
  }
});

async function commitAndPushToGitHub(uploadedImagePath) {
    try {
      // Read image content
      const fileContent = fs.readFileSync(uploadedImagePath);
  
      // Commit and push changes to GitHub
      const response = await axios.put(
        `https://api.github.com/repos/imkishan1/imagestore/contents/images/${path.basename(uploadedImagePath)}`,
        {
          message: 'Add image',
          content: fileContent.toString('base64'),
        },
        {
          auth: {
            username: 'imkishan1',
            password:  process.env.GITHUB_TOKEN, // Replace with your actual GitHub token
          },
        }
      );
  
      console.log('GitHub Image URL:', response.data.content.download_url);
  
      return response.data.content.download_url;
    } catch (error) {
      console.error('Error committing changes to GitHub:', error);
      throw new Error('Error committing changes to GitHub.');
    }
  }

// ... (rest of your existing routes)

// module.exports = router;


module.exports = router;