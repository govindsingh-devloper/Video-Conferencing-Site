import React, { useContext, useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment.js';
import { AuthContext } from '../contexts/AuthContext.jsx';


const server_url = server
var connections = {};
const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" }
  ]
};

const VideoMeet = () => {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();
  const videoRef = useRef([]);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState([]);
  const [audio, setAudio] = useState();
  const [screen, setScreen] = useState();
  const [showModal, setModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState();
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  const {userData}=useContext(AuthContext);
  console.log("User Data",userData)

  useEffect(() => {
    console.log("HELLO")
    getPermissions();

})

let getDislayMedia = () => {
    if (screen) {
        if (navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDislayMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        }
    }
}

const getPermissions = async () => {
    try {
        const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoPermission) {
            setVideoAvailable(true);
            console.log('Video permission granted');
        } else {
            setVideoAvailable(false);
            console.log('Video permission denied');
        }

        const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (audioPermission) {
            setAudioAvailable(true);
            console.log('Audio permission granted');
        } else {
            setAudioAvailable(false);
            console.log('Audio permission denied');
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }

        if (videoAvailable || audioAvailable) {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
            if (userMediaStream) {
                window.localStream = userMediaStream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = userMediaStream;
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
};

useEffect(() => {
    if (video !== undefined && audio !== undefined) {
        getUserMedia();
        console.log("SET STATE HAS ", video, audio);

    }


}, [video, audio])
let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();

}




let getUserMediaSuccess = (stream) => {
    try {
        window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) { console.log(e) }

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
        if (id === socketIdRef.current) continue

        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
            console.log(description)
            connections[id].setLocalDescription(description)
                .then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                })
                .catch(e => console.log(e))
        })
    }

    stream.getTracks().forEach(track => track.onended = () => {
        setVideo(false);
        setAudio(false);

        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { console.log(e) }

        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = blackSilence()
        localVideoref.current.srcObject = window.localStream

        for (let id in connections) {
            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }
    })
}

let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
        navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
            .then(getUserMediaSuccess)
            .then((stream) => { })
            .catch((e) => console.log(e))
    } else {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
    }
}





let getDislayMediaSuccess = (stream) => {
    console.log("HERE")
    try {
        window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) { console.log(e) }

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
        if (id === socketIdRef.current) continue

        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description)
                .then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                })
                .catch(e => console.log(e))
        })
    }

    stream.getTracks().forEach(track => track.onended = () => {
        setScreen(false)

        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { console.log(e) }

        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = blackSilence()
        localVideoref.current.srcObject = window.localStream

        getUserMedia()

    })
}

let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if (fromId !== socketIdRef.current) {
        if (signal.sdp) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                if (signal.sdp.type === 'offer') {
                    connections[fromId].createAnswer().then((description) => {
                        connections[fromId].setLocalDescription(description).then(() => {
                            socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                        }).catch(e => console.log(e))
                    }).catch(e => console.log(e))
                }
            }).catch(e => console.log(e))
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
        }
    }
}




let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false })

    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on('connect', () => {
        socketRef.current.emit('join-call', window.location.href)
        socketIdRef.current = socketRef.current.id

        socketRef.current.on('chat-message', addMessage)

        socketRef.current.on('user-left', (id) => {
            setVideos((videos) => videos.filter((video) => video.socketId !== id))
        })

        socketRef.current.on('user-joined', (id, clients) => {
            clients.forEach((socketListId) => {

                connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                // Wait for their ice candidate       
                connections[socketListId].onicecandidate = function (event) {
                    if (event.candidate != null) {
                        socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                    }
                }

                // Wait for their video stream
                connections[socketListId].onaddstream = (event) => {
                    console.log("BEFORE:", videoRef.current);
                    console.log("FINDING ID: ", socketListId);

                    let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                    if (videoExists) {
                        console.log("FOUND EXISTING");

                        // Update the stream of the existing video
                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === socketListId ? { ...video, stream: event.stream } : video
                            );
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    } else {
                        // Create a new video
                        console.log("CREATING NEW");
                        let newVideo = {
                            socketId: socketListId,
                            stream: event.stream,
                            autoplay: true,
                            playsinline: true
                        };

                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    }
                };


                // Add the local video stream
                if (window.localStream !== undefined && window.localStream !== null) {
                    connections[socketListId].addStream(window.localStream)
                } else {
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                    window.localStream = blackSilence()
                    connections[socketListId].addStream(window.localStream)
                }
            })

            if (id === socketIdRef.current) {
                for (let id2 in connections) {
                    if (id2 === socketIdRef.current) continue

                    try {
                        connections[id2].addStream(window.localStream)
                    } catch (e) { }

                    connections[id2].createOffer().then((description) => {
                        connections[id2].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                }
            }
        })
    })
}

let silence = () => {
    let ctx = new AudioContext()
    let oscillator = ctx.createOscillator()
    let dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start()
    ctx.resume()
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
}
let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height })
    canvas.getContext('2d').fillRect(0, 0, width, height)
    let stream = canvas.captureStream()
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
}

let handleVideo = () => {
    setVideo(!video);
    //getUserMedia();
}



let handleAudio = () => {
    setAudio(!audio)
    // getUserMedia();
}

useEffect(() => {
    if (screen !== undefined) {
        getDislayMedia();
    }
}, [screen])
let handleScreen = () => {
    setScreen(!screen);
}

let handleEndCall = () => {
    try {
        let tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
    } catch (e) { }
    window.location.href = "/"
}

let openChat = () => {
    setModal(true);
    setNewMessages(0);
}
let closeChat = () => {
    setModal(false);
}
let handleMessage = (e) => {
    setMessage(e.target.value);
}

const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
        ...prevMessages,
        { sender: sender, data: data }
    ]);
    //Same insaan apne app ko thodi send krega
    if (socketIdSender !== socketIdRef.current) {
        setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
};



let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit('chat-message', message, username)
    setMessage("");

    // this.setState({ message: "", sender: username })
}


let connect = () => {
    setAskForUsername(false);
    getMedia();
}

return (
  <div className="relative h-screen bg-[rgb(1,4,48)]">
  {askForUsername === true ? (
    <div>
      <h2 className='text-white'>Enter into Lobby</h2>
      <div className="flex mt-4 gap-4 mb-4 text-white border-white">
        <TextField
          id="outlined-basic"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          variant="outlined"
        />
        <Button variant="contained" onClick={connect}>
          Connect
        </Button>
      </div>

      <div>
        <video ref={localVideoref} autoPlay muted />
      </div>
    </div>
  ) : (
    <div className="relative h-screen bg-[rgb(1,4,48)]">
      {/* Chat */}
      {showModal ? (
        <div className="absolute h-[90vh] right-0 bg-white rounded-lg w-[30vw] px-5">
          <div className="relative h-full">
            <h1>Chat</h1>
            <div>
              {messages.length > 0 ? (
                messages.map((item, index) => (
                  <div key={index} className="mb-2">
                    <p className="font-bold">{item.sender}</p>
                    <p>{item.data}</p>
                  </div>
                ))
              ) : (
                <p>No Messages yet</p>
              )}
            </div>
            <div className="flex absolute bottom-0 mb-2 gap-4">
              <TextField
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                id="outlined-basic"
                label="Enter your message"
              />
              <Button variant="contained" onClick={sendMessage}>
                Send
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Buttons */}
      <div className="flex justify-center items-end h-screen">
        <IconButton
          onClick={handleVideo}
          className="text-white transform hover:scale-110 transition-transform duration-300 ease-in-out"
        >
          {video === true ? (
            <VideocamIcon className="text-white transform scale-110" />
          ) : (
            <VideocamOffIcon className="text-white transform scale-110" />
          )}
        </IconButton>

        <IconButton onClick={handleEndCall} className="text-white">
          <CallEndIcon className="text-white" />
        </IconButton>

        <IconButton onClick={handleAudio}>
          {audio === true ? (
            <MicIcon className="text-white" />
          ) : (
            <MicOffIcon className="text-white" />
          )}
        </IconButton>

        {screenAvailable === true ? (
          <IconButton onClick={handleScreen}>
            {screen === true ? (
              <ScreenShareIcon className="text-white" />
            ) : (
              <StopScreenShareIcon className="text-white" />
            )}
          </IconButton>
        ) : null}

        <Badge badgeContent={newMessages} max={999} color="secondary">
          <IconButton onClick={() => setModal(!showModal)}>
            <ChatIcon className="text-white" />
          </IconButton>
        </Badge>
      </div>

      {/* Remote Videos - Updated to be fixed and responsive */}
      <div className="absolute top-0 left-0 right-0 flex justify-center items-start flex-wrap gap-4 p-4">
        {videos.map((video) => (
          <div
            className="flex flex-col items-center gap-2 p-2"
            key={video.socketId}
          >
            <h2 className="text-white">{video.username || video.socketId}</h2>
            <h2 className="text-white">{video.username}</h2>

            <video
              className="w-[20vw] h-[15vw] min-w-[15vw] rounded-[10px] object-cover"
              data-socket={video.socketId}
              ref={(ref) => {
                if (ref && video.stream) {
                  ref.srcObject = video.stream;
                }
              }}
              autoPlay
            ></video>
          </div>
        ))}
      </div>

      {/* Local Video */}
      <div className="absolute bottom-[30px] left-[10px] w-[20vw] h-[15vw] rounded-[20px] bg-gray-900">
        <video
          ref={localVideoref}
          autoPlay
          muted
          className="w-full h-full rounded-[20px] object-cover"
        ></video>
        <h2 className='text-white'>{video.name}</h2>
      </div>
    </div>
  )}
</div>

  );
  
  
};

export default VideoMeet;
