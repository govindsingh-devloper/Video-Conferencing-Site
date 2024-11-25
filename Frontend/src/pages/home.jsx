import React, { useContext, useState } from 'react'
import withAuth from '../utilis/withAuth'
import "../App.css";
import {useNavigate } from 'react-router-dom'

import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';




const Home = () => {

const navigate=useNavigate()
const [meetingCode,setMeetingCode]=useState("");

const {addToUserHistory }=useContext(AuthContext);
let handleJoinVideoCall=async()=>{
    await addToUserHistory(meetingCode)
   navigate(`/${meetingCode}`)
}
  return (
    <>
    <div>
        <div className='flex items-center justify-between pr-20'>
        <h3>Video Call</h3>

        </div>

        <div className='flex items-center '>
            <IconButton 
            onClick={()=>{
                navigate("/history")
            }}
            >
                <RestoreIcon />
                <p>History</p>
            </IconButton>

            <Button 
            
            onClick={()=>{
                localStorage.removeItem("token")
                navigate("/")
            }}>
                Logout
            </Button>
        </div>
    </div>

    <div className='meetContainer'>
        <div className='leftPanel'>
        <div>
            <h2 className='mb-2'>Providing Video Call just like quality Education</h2>
            <div className='flex gap-4'>
            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" />
            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
            </div>
        </div>

        </div>

    </div>

    <div className='rightPanel'>
        <img src='../public/logo3.png'/>
        
    </div>
    </>
    
  )
}

export default withAuth(Home)