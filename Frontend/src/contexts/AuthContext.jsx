import axios, { HttpStatusCode } from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
  // baseURL: "http://localhost:4000/api/v1/auth" // Correct base URL
  baseURL:`${server}/api/v1/auth`,
  withCredentials: true,

});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);
  const navigate = useNavigate();

  const handleRegister = async (name, username, password, confirmPassword) => {
    try {
      // Make the API request to register the user
      let response = await client.post("/register", {
        name: name,
        username: username,
        password: password,
        confirmPassword: confirmPassword,
      });
  
      // Check if registration is successful
      if (response.data.success) {
        // Return success response data if the registration is successful
        return response.data.message;
      } 
  
    } catch (error) {
      console.log("Register Error.....", error);
      // Return an error object so that the calling function can handle it properly
     throw Error;
    }
  };
  

  // Login
  const handleLogin = async (username, password) => {
    try {
      let response = await client.post("/login", {
        username: username,
        password: password
      });

      console.log("Login Response....",response);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        navigate("/home") // Return the response data to be used later

      } else {
        throw new Error(response.data.message);
      }
    
      // You can also redirect or update state after login success.
    } catch (error) {
      console.log("Login API Error.....", error);
    }
  };

  const getHistoryOfUser=async()=>{
    try {
      let response=await client.get("/get_all_activity",{
        params:{
          token:localStorage.getItem("token")
        }
      });
      return response;
    } catch (error) {
      console.log(error)
      throw new Error
      
    }
  }

  const addToUserHistory=async(meetingCode)=>{
    try {
      let response=await client.post("/add_to_activity",{
        token:
          localStorage.getItem("token"),
          meetingCode:meetingCode
        
      })
      return response;
      
    } catch (error) {
      throw new Error
      
    }

  }

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    getHistoryOfUser,
    addToUserHistory
  };

  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};
