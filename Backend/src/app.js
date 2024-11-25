const express=require('express');
const app=express();

const database=require("../src/config/database");
const cookieParser=require("cookie-parser");
const http = require('http'); 
const Server=require('socket.io');
const connectToSocket=require("../src/config/socketManager.js")

//Express alg h ,socket alg h to connection
//app ko server se connect
const server = http.createServer(app);

//server ko new server se connect

const io=connectToSocket(server)
//Jb server chlega usme app aur io hoga



const cors=require('cors');
const dotenv=require('dotenv');

dotenv.config();



const PORT=process.env.PORT || 4000

//Router
const UserRoutes=require('../src/routes/User');


//DB Connection
database.connect();

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({limit:"40kb",extended:true}));
const allowedOrigins = [
    'http://localhost:3000',  // Local development frontend
    'https://videofrontend-77zt.onrender.com'  // Deployed frontend
  ];
  
  // Use the dynamic origins in the CORS middleware
  app.use(
    cors({
      origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
          callback(null, true);  // Allow the request
        } else {
          callback(new Error('Not allowed by CORS'));  // Reject the request
        }
      },
      credentials: true,  // If you're using cookies or session-based authentication
    })
  );


//Routes
app.use("/api/v1/auth",UserRoutes)
app.options('*', cors());  // This handles preflight OPTIONS requests



//default route
app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"Your server is runing"
    })
});


//activate Server
server.listen(PORT,()=>{
    console.log(`App is runing at ${PORT}`)
})

