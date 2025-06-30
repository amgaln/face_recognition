'use client'
import Webcam from "react-webcam";

interface WebcamRef {

}

export default function CameraPage() {
  return (
    <div className="flex flex-col justify-center items-center h-screen relative space-y-6">
      <h2 className="text-center w-full mb-4 font-bold">Царай таниулах</h2>
      <ul className="w-full max-w-md space-y-4">
        <li className="flex justify-center items-center">
          <Webcam
            className="w-72 h-96 rounded-full object-cover border-4 border-black shadow-lg bg-white"
            style={{
              transform: 'scaleX(-1)',
              borderRadius: '60% 60% 70% 70% / 55% 55% 80% 80%',
            }}
          />
        </li>
        <li className="text-center w-full mb-4 text-gray-500">
          Царайгаа ойртуулна уу.
        </li>
        {/* Add more list items here if needed */}
        <li>
          <button
            type="button"
            className="w-full py-2 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            onClick={() => window.location.href = '/camera/fail'}
          >
            Царай таниулах
          </button>
        </li>
      </ul>
    </div>
  );
}