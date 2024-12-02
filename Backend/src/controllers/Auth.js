const User=require("../models/UserModel")
const Meeting=require("../models/MeetingModel")
const bcrypt=require("bcryptjs");
const crypto =require('crypto')



exports.register=async(req,res)=>{
    try {
        const {name,username,password,confirmPassword}=req.body;
        if(!name || !username || !password){
            return res.status(403).json({
                success:false,
                message:"All fields are required"
            })
        }
        //Match the Password
        if(password!=confirmPassword){
            return res.status(201).json({
                success:false,
                message:"Password And Confirm Password sould be Same"
            })
        }

        //check for existing user 
        const existingUser=await User.findOne({username});
        if(existingUser){
            return res.status(302).json({
                success:false,
                message:"User is Already Exist"
            })
        }

        //hash the password
        const hashedPassword=await bcrypt.hash(password,10)
        
        const user=await User.create({
            name,
            username,
            password:hashedPassword
        })
        
        //return res
        return res.status(200).json({
            success:true,
            message:"User Registered SuccessFully",
            data:user
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"User Cannot be registered SuccessFULLY"
        })
        
    }
}

exports.login=async(req,res)=>{
    const {username,password}=req.body;
    try {
        if(!username || !password){
            return res.status(403).json({
                success:false,
                message:"ALL fields are Required"
            })
        }

        //check user exist or not
        const user=await User.findOne({username})
        if(!user){
            return res.status(500).json({
                success:false,
                message:"User Not registered"
            })
        }
        //generate JWT, after password matching
        if(await bcrypt.compare(password,user.password)){
            //make a payload
           let token=crypto.randomBytes(20).toString("hex");

           user.token=token;
           await user.save();

           return res.status(200).json({
            success:true,
            message:"User Login SuccessFully",
            token:token,
            user:{
                _id: user._id,
               username: user.username,
              name: user.name,
            }
           })
        }else{
            return res.status(500).json({
                success:false,
                message:"Invalid UserName or Password"
            })
        }
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login Fail Pls Try again"
        })
        
    }

}

exports.getUserHistory=async(req,res)=>{
    const {token}=req.body

    try {
        const user=await User.findOne({token:token});
        const meetings=await Meeting.find({user_id:user.username})
        return res.status(200).json({
            success:true,
            message:"Meetings Fetched SuccessFully",
            meetings
        })
        
    } catch (error) {
        console.log("Get User history Error");
        return res.status(500).json({
            success:false,
            message:"History cant fetched SuccessFully"
        })
        
    }
}

exports.addToHistory = async (req, res) => {
    const { token, meetingCode } = req.body;
    try {
      const user = await User.findOne({ token: token });
      console.log("User found:", user); // Make sure the user is correctly fetched
      
      const newMeetings = new Meeting({
        user_id: user.username,
        meetingCode: meetingCode
      });
  
      await newMeetings.save();
  
      const response = {
        success: true,
        message: "ADDED Code To History",
        user: user  // Include user object here
      };
  
      console.log("Response:", response); // Log the response before sending
      return res.status(200).json(response);
  
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  