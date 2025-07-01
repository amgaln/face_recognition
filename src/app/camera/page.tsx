'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';

const CameraPage: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Царайгаа камерт ойртуулна уу.');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isWebcamReady, setIsWebcamReady] = useState<boolean>(false);
  const [consistentFaceCount, setConsistentFaceCount] = useState<number>(0);

  // Check camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch (error: any) {
        console.error('Camera permission error:', error.message);
        setHasPermission(false);
        setStatusMessage('Камерын зөвшөөрөл өгнө үү.');
        setTimeout(() => router.push('/camera/fail'), 3000);
      }
    };
    checkPermission();
  }, [router]);

  // Set up face detection interval and timeout
  useEffect(() => {
    if (!hasPermission || isCapturing || !isWebcamReady) return;

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (!isCapturing) {
          setStatusMessage('10 секундын дотор царай бүртгэгдээгүй.');
          router.push('/camera/fail');
        }
      }, 10000); // Changed from 30000 (30 seconds) to 10000 (10 seconds)
    };

    resetTimeout();
    intervalRef.current = setInterval(() => {
      detectFaces(resetTimeout);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasPermission, isCapturing, isWebcamReady]);

  // Detect faces using AWS Rekognition
  const detectFaces = async (resetTimeout: () => void) => {
    if (isCapturing || !webcamRef.current || !isWebcamReady) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error('Failed to capture screenshot');
      setStatusMessage('Зураг авахад алдаа гарлаа.');
      return;
    }

    const base64Image = imageSrc.split(',')[1];
    if (!base64Image) {
      console.error('Invalid base64 image data');
      setStatusMessage('Зургийн өгөгдөл буруу байна.');
      return;
    }

    try {
      console.log('Sending face detection request to /api/rekognition');
      const res = await fetch('/api/rekognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Face detection API error:', res.status, res.statusText, errorText);
        throw new Error(`Face detection failed: ${res.statusText}`);
      }

      const data = await res.json();
      const faceDetails = data.FaceDetails;

      if (faceDetails?.length === 1 && faceDetails[0].Confidence > 90) {
        setStatusMessage('Царай илрэв!');
        setConsistentFaceCount((prev) => {
          const count = prev + 1;
          if (count >= 3) {
            setIsCapturing(true);
            performLivenessCapture();
          }
          return count;
        });
        resetTimeout();
      } else {
        setStatusMessage(faceDetails?.length > 1 ? 'Зөвхөн нэг царай илрүүлнэ.' : 'Царай илрээгүй.');
        setConsistentFaceCount(0);
      }
    } catch (err: any) {
      console.error('Face detection error:', err.message);
      setStatusMessage('Царай илрүүлэхэд алдаа гарлаа.');
      router.push('/camera/fail');
    }
  };

  // Perform final liveness capture
  const performLivenessCapture = useCallback(async () => {
    if (!webcamRef.current || !isWebcamReady) {
      console.error('Webcam not ready for liveness capture');
      setStatusMessage('Камер бэлэн биш байна.');
      router.push('/camera/fail');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error('Failed to capture screenshot for liveness');
      setStatusMessage('Зургийг авахад алдаа гарлаа.');
      router.push('/camera/fail');
      return;
    }

    const base64Image = imageSrc.split(',')[1];
    if (!base64Image) {
      console.error('Invalid base64 image data for liveness');
      setStatusMessage('Зургийн өгөгдөл буруу байна.');
      router.push('/camera/fail');
      return;
    }

    try {
      console.log('Sending liveness capture request to /api/rekognition');
      const res = await fetch('/api/rekognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Liveness API error:', res.status, res.statusText, errorText);
        throw new Error(`Final capture failed: ${res.statusText}`);
      }

      const data = await res.json();
      const faceDetails = data.FaceDetails;

      if (faceDetails?.length === 1 && faceDetails[0].Confidence > 90) {
        setStatusMessage('Царай амжилттай бүртгэгдлээ!');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setTimeout(() => router.push('/camera/success'), 1000);
      } else {
        setStatusMessage('Царайны баталгаажуулалт амжилтгүй боллоо.');
        router.push('/camera/fail');
      }
    } catch (err: any) {
      console.error('Liveness error:', err.message);
      setStatusMessage('Баталгаажуулалтын явцад алдаа гарлаа.');
      router.push('/camera/fail');
    }
  }, [isWebcamReady, router]);

  return (
    <div className="flex flex-col justify-center items-center h-screen space-y-6">
      <h2 className="text-center text-2xl font-bold">Царай таниулах</h2>
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={1}
          width={640}
          height={480}
          className="w-72 h-96 rounded-full object-cover border-4 border-black"
          style={{
            transform: 'scaleX(-1)',
            borderRadius: '60% 60% 70% 70% / 55% 55% 80% 80%',
          }}
          onUserMedia={() => {
            setIsWebcamReady(true);
            setStatusMessage('Царайгаа камерт ойртуулна уу.');
          }}
          onUserMediaError={(error) => {
            console.error('Webcam error:', error);
            setIsWebcamReady(false);
            setHasPermission(false);
            setStatusMessage('Камер холбогдсон эсэхээ шалгана уу.');
            setTimeout(() => router.push('/camera/fail'), 3000);
          }}
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded text-sm">
          {statusMessage}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Камерын төлөв: {hasPermission === null ? 'Хүлээж байна' : hasPermission ? 'Зөвшөөрсөн' : 'Татгалзсан'}
      </p>
    </div>
  );
};

export default CameraPage;