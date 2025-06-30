'use client'
import Webcam from "react-webcam";

interface WebcamRef {

}

export default function CameraPage() {
  return (
    <div className="flex justify-center items-center h-screen relative">
      <div className="relative flex justify-center items-center">
        <Webcam
          className="w-72 h-96 rounded-full object-cover border-4 border-white shadow-lg bg-black"
          style={{
            transform: 'scaleX(-1)',
            borderRadius: '60% 60% 70% 70% / 55% 55% 80% 80%',
          }}
        />

      </div>

    </div>
  );
}