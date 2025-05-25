import React from "react";
import {
  Route,
  Routes,
} from "react-router-dom";
import './index.css'
import VibeAudioStreamer from './components/VibeStream'
import Home from "./components/Home";
import PrerecordedDemoUpload from "./components/UploadDemo";
import AudioRecorderPlayer from "./components/SendReceiveAudioChunks";


export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prerecorded" element={<PrerecordedDemoUpload />} />
        <Route path="/mic" element={<AudioRecorderPlayer />} />
      </Routes>
    </div>
  );
}