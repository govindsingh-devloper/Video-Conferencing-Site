import { Routes, Router,Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/landingPage";
import Authentication from "./pages/authentication";
import VideoMeet from "./pages/VideoMeet";
import Home from "./pages/home";
import History from "./pages/history";
import { AuthProvider } from "./contexts/AuthContext";





function App() {
  return (
    <>
     
        <Routes>

        <Route  path="/home" element={<Home/>}/>
          <Route  path="/auth" element={<Authentication/>}/>
          <Route  path="/"     element={<LandingPage/>}/>
          <Route  path="/:url" element={<VideoMeet/>}/>
          <Route  path="/history" element={<History/>}/>
          

        </Routes>
      
    </>
  );
}

export default App;
