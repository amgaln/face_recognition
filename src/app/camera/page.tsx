'use client'
import Webcam from "react-webcam";

export default function CameraPage() {
  return (
    <div className="flex justify-center items-center h-screen">
        <div className="w-full max-w-[640px] aspect[4/3] relative">
            <Webcam
                style={{
                    transform: 'scaleX(-1)',
                }}
            />
        </div>
    </div>
  );
}

