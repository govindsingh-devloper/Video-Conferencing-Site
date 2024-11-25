 // Initialize socket connection
 useEffect(() => {
    socket.current = io("http://localhost:4000"); // Replace with your socket server URL
    socket.current.on("connect", () => {
      console.log("Connected to socket server");
      setVideo((prevState) => ({
        ...prevState,
        socketId: socket.current.id,
      }));
    });

    // Handle the case when another user joins
    socket.current.on("user-joined", (userId) => {
      console.log('User joined:', userId);
      createPeerConnection(userId);
    });

    // Handle the case when a user leaves
    socket.current.on("user-left", (userId) => {
      console.log('User left:', userId);
      // Clean up the peer connection for this user
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
        delete remoteVideoRefs.current[userId];
      }
    });

    // Listen for signaling messages (offer/answer/ICE candidates)
    socket.current.on("offer", handleOffer);
    socket.current.on("answer", handleAnswer);
    socket.current.on("ice-candidate", handleNewICECandidate);

    // Update the list of users in the call
    socket.current.on("users-in-call", (users) => {
      setUsersInCall(users);
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // Get local media stream (video and audio)
  const getUserMediaSuccess = (stream) => {
    console.log("Local stream acquired:", stream);

    // Set the local stream to the video element
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    } else {
      console.error("localVideoref is not available.");
    }

    localStream.current = stream; // Store the local stream

    // Emit the join-call event after local stream is acquired
    socket.current.emit("join-call", video.socketId);
  };

  // Request access to the user's camera and microphone
  const getUserMedia = async () => {
    if (localStream.current) {
      return; // Avoid acquiring the stream again if it already exists
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      getUserMediaSuccess(stream);
    } catch (error) {
      console.error("Error acquiring media:", error);
    }
  };

  // Create a peer connection for a new user
  const createPeerConnection = (userId) => {
    if (!localStream.current) return; // Ensure local stream exists

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerConnections.current[userId] = peerConnection;

    // Add local stream tracks to peer connection
    localStream.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream.current);
    });

    // Create offer to start the connection
    peerConnection
      .createOffer()
      .then((offer) => {
        return peerConnection.setLocalDescription(offer);
      })
      .then(() => {
        socket.current.emit("offer", {
          offer: peerConnection.localDescription,
          to: userId,
        });
      });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: userId,
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Remote stream received:', event.streams[0]);
      if (!remoteVideoRefs.current[userId]) {
        remoteVideoRefs.current[userId] = document.createElement('video');
        remoteVideoRefs.current[userId].autoplay = true;
        remoteVideoRefs.current[userId].muted = true; // Set remote video to muted (if necessary)
        remoteVideoRefs.current[userId].style.width = '300px';
        remoteVideoRefs.current[userId].style.height = '200px';
        document.getElementById('remoteVideos').appendChild(remoteVideoRefs.current[userId]);
      }
      remoteVideoRefs.current[userId].srcObject = event.streams[0];
    };
  };

  // Handle incoming offer from another peer
  const handleOffer = (data) => {
    const { offer, from } = data;

    // Create a new peer connection for this user
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerConnections.current[from] = peerConnection;

    // Add local stream tracks to peer connection
    localStream.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream.current);
    });

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        return peerConnection.createAnswer();
      })
      .then((answer) => {
        return peerConnection.setLocalDescription(answer);
      })
      .then(() => {
        socket.current.emit("answer", {
          answer: peerConnection.localDescription,
          to: from,
        });
      });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: from,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Remote stream received:', event.streams[0]);
      if (!remoteVideoRefs.current[from]) {
        remoteVideoRefs.current[from] = document.createElement('video');
        remoteVideoRefs.current[from].autoplay = true;
        remoteVideoRefs.current[from].muted = true; // Set remote video to muted (if necessary)
        remoteVideoRefs.current[from].style.width = '300px';
        remoteVideoRefs.current[from].style.height = '200px';
        document.getElementById('remoteVideos').appendChild(remoteVideoRefs.current[from]);
      }
      remoteVideoRefs.current[from].srcObject = event.streams[0];
    };
  };

  // Handle incoming answer from another peer
  const handleAnswer = (data) => {
    const { answer, from } = data;
    const peerConnection = peerConnections.current[from];
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  // Handle incoming ICE candidates from peers
  const handleNewICECandidate = (data) => {
    const { candidate, from } = data;
    const peerConnection = peerConnections.current[from];
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  useEffect(() => {
    getUserMedia(); // Initialize media when component mounts
  }, []);






//   return
<div>
      <h1>Video Meeting</h1>
      <div>
        {video.socketId && <h2>Socket ID: {video.socketId}</h2>}
        <div>
          <video
            ref={localVideoref}
            autoPlay
            muted
            style={{ width: '300px', height: '200px' }}
          />
        </div>

        <div id="remoteVideos">
          {usersInCall.length === 0 ? (
            <h2>No users are currently in the call.</h2>
          ) : (
            <h2>
              Users in the call:{" "}
              {usersInCall.map((user, index) => (
               <>
               <span key={index}>{user}</span>
               <video 
                data-socket={user.socketId}
                ref={ref=>{
                    if(ref && user.stream){
                        ref.srcObject=user.stream
                    }
                }}
                autoPlay
                >

               </video>
               </> 
                
              ))}
            </h2>
          )}
        </div>
      </div>
    </div>




 <div>
          <div>
            <h2>Your Video</h2>
            <video ref={localVideoref} autoPlay muted />
          </div>

          {videos.length > 0 && (
            <div>
              <h2>Remote Videos</h2>
              {videos.map((v) => {
                return (
                  <div key={v.socketId}>
                    <h3>Peer ID: {v.socketId}</h3>
                    <video
                      data-socket={v.socketId}
                      ref={(ref) => {
                        if (ref && v.stream) {
                          ref.srcObject = v.stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      style={{ width: "300px", height: "200px", border: "1px solid #ccc", margin: "10px" }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
    </div>