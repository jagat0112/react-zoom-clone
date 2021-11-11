import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import "./App.css";

const socket = io("http://localhost:5001");

function App() {
  const [stream, setStream] = useState("");
  const [me, setMe] = useState("");
  const [peerId, setPeerId] = useState("");
  const [callerSignal, setCallerSignal] = useState("");
  const [caller, setCaller] = useState("");
  const [recievingCall, setRecievingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();

  useEffect(() => {
    // get access to audio and video
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });

    // Getting id
    socket.on("me", (id) => {
      setMe(id);
    });

    // Recieving call
    socket.on("callUser1", (data) => {
      console.log("USER CALLING.....");
      setCallerSignal(data.signal);
      setCaller(data.from);
      setRecievingCall(true);
    });
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", { signal: data, userToCall: id, from: me });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    // If call is accepted by other peer
    socket.on("callAccepted", ({ signal }) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  };

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      // Sending signal back to caller
      socket.emit("answerCall", {
        signal: data,
        to: caller,
      });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ZOOM CLONE</h1>
        {recievingCall && !callAccepted && (
          <div>
            <p>{caller} is calling......</p>
            <button onClick={answerCall}>ANSWER</button>
          </div>
        )}
        <video
          playsInline
          ref={myVideo}
          autoPlay
          muted
          style={{ width: "300px" }}
        />
        {callAccepted && (
          <video
            playsInline
            ref={userVideo}
            autoPlay
            muted
            style={{ width: "300px" }}
          />
        )}
        <p>{me}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            callUser(peerId);
            console.log("submited");
          }}
        >
          <input
            type="text"
            placeholder="ID to call"
            value={peerId}
            onChange={(e) => {
              setPeerId(e.target.value);
            }}
          ></input>
          <button type="submit">Call</button>
        </form>
      </header>
    </div>
  );
}

export default App;
