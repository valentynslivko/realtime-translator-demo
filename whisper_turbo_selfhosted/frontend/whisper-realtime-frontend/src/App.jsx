import React from "react";
import {
  Route,
  Routes,
} from "react-router-dom";
import './index.css'
import VibeAudioStreamer from './components/VibeStream'
import Home from "./components/Home";

export default function App() {
  return (
    <div>
      {/* <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mic" element={<VibeAudioStreamer />} />
      </Routes> */}
      <VibeAudioStreamer />
    </div>
  );
}