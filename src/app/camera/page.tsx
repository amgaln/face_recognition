'use client'

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { rekognition } from '../../../config/aws-config'; // Adjust path as needed

const CameraPage: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAlertRef = useRef<number>(0); // Track time of last alert
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Царайгаа камерт ойртуулна уу.');
  const [capture, setCapture] = useState<boolean>(false);
  const [isWebcamReady, setIsWebcamReady] = useState<boolean>(false);
  const [consistentFaceCount, setConsistentFaceCount] = useState<number>(0);

  // Check camera permission
  useEffect(() => {
    console.log('Checking camera permission...');
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera permission granted');
        setHasPermission(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
        setStatusMessage('Камерын зөвшөөрөл өгнө үү. Камерын тохиргоогоо шалгана уу.');
        setTimeout(() => {
          console.log('Redirecting to /camera/fail due to permission denial');
          router.push('/camera/fail');
        }, 3000);
      }
    };
    checkPermission();
  }, [router]);

  // Start face detection and timeout
  useEffect(() => {
    if (!hasPermission || capture || !isWebcamReady) {
      console.log('Face detection not started: hasPermission=', hasPermission, 'capture=', capture, 'isWebcamReady=', isWebcamReady);
      return;
    }

    console.log('Starting face detection interval...');
    const resetTimeout = () => {
      if (timeoutRef.current) {
        console.log('Clearing previous timeout');
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (!capture) {
          console.log('30-second timeout reached, no face captured');
          setStatusMessage('30 секундын дотор царай бүртгэгдээгүй.');
          router.push('/camera/fail');
        }
      }, 30000);
    };

    resetTimeout();
    intervalRef.current = setInterval(() => {
      detectFaces(resetTimeout);
    }, 1000);

    return () => {
      console.log('Cleaning up interval and timeout');
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasPermission, capture, isWebcamReady]);

  const detectFaces = async (resetTimeout: () => void) => {
    if (capture || !webcamRef.current || !isWebcamReady) {
      console.log('Skipping detection: capture=', capture, 'webcamRef=', !!webcamRef.current, 'isWebcamReady=', isWebcamReady);
      return;
    }

    console.log('Attempting screenshot...');
    let imageSrc: string | null = null;
    for (let i = 0; i < 3; i++) {
      imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) break;
      console.warn(`Screenshot attempt ${i + 1} failed`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!imageSrc) {
      console.error('Failed to capture screenshot after retries');
      setStatusMessage('Камераас зураг авах боломжгүй. Камер холбогдсон эсэхээ шалгана уу.');
      return;
    }

    const base64Image = imageSrc.split(',')[1];
    const params = {
      Image: { Bytes: Buffer.from(base64Image, 'base64') },
      Attributes: ['ALL'] as ('ALL' | 'DEFAULT')[],
    };

    try {
      console.log('Sending image to Rekognition');
      const response = await rekognition.detectFaces(params).promise();
      console.log('Rekognition response:', JSON.stringify(response, null, 2));

      const faceDetails = response.FaceDetails;
      if (faceDetails && Array.isArray(faceDetails) && faceDetails.length === 1 && faceDetails[0].Confidence && faceDetails[0].Confidence > 90) {
        console.log('Valid face detected, confidence:', faceDetails[0].Confidence);
        setStatusMessage('Царай илрэв! Байрлалаа хадгал.');
        setConsistentFaceCount((prev) => {
          const newCount = prev + 1;
          console.log('Consistent face count:', newCount);
          if (newCount >= 3) {
            console.log('3 consistent detections, triggering capture');
            setCapture(true);
            performLivenessCapture();
          }
          return newCount;
        });
        resetTimeout(); // Extend timeout on valid detection
      } else {
        console.log('Invalid detection: FaceDetails length=', faceDetails?.length ?? 0);
        setStatusMessage(
          faceDetails && faceDetails.length > 1
            ? 'Зөвхөн нэг царай илрүүлнэ үү.'
            : 'Царай илрээгүй. Царайгаа камерт ойртуулна уу.'
        );
        // Show alert only if no face detected and 5 seconds have passed since last alert
        if (!faceDetails || faceDetails.length === 0) {
          const now = Date.now();
          if (now - lastAlertRef.current >= 5000) {
            alert('Царай илрээгүй. Царайгаа камерт ойртуулна уу.');
            lastAlertRef.current = now;
            console.log('No face alert shown at:', new Date(now).toISOString());
          }
        }
        setConsistentFaceCount(0);
      }
    } catch (error: any) {
      console.error('Rekognition error:', error.message, error.stack);
      setStatusMessage('Царай илрүүлэхэд алдаа гарлаа. Дахин оролдоно уу.');
      setConsistentFaceCount(0);
    }
  };

  const performLivenessCapture = useCallback(async () => {
    if (!webcamRef.current || !isWebcamReady) {
      console.error('Webcam not available for final capture');
      setStatusMessage('Вэбкам байхгүй байна.');
      router.push('/camera/fail');
      return;
    }

    console.log('Attempting final capture screenshot...');
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error('Final screenshot failed');
      setStatusMessage('Эцсийн зураг авах боломжгүй.');
      router.push('/camera/fail');
      return;
    }

    const base64Image = imageSrc.split(',')[1];
    const params = {
      Image: { Bytes: Buffer.from(base64Image, 'base64') },
      Attributes: ['ALL'] as ('ALL' | 'DEFAULT')[],
    };

    try {
      console.log('Performing final liveness capture');
      const response = await rekognition.detectFaces(params).promise();
      console.log('Final capture response:', JSON.stringify(response, null, 2));
      const faceDetails = response.FaceDetails;
      if (faceDetails && Array.isArray(faceDetails) && faceDetails.length === 1 && faceDetails[0].Confidence && faceDetails[0].Confidence > 90) {
        console.log('Liveness capture successful');
        setStatusMessage('Царай амжилттай бүртгэгдлээ!');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setTimeout(() => {
          console.log('Redirecting to /camera/success');
          router.push('/camera/success');
        }, 1000);
      } else {
        console.log('Final capture failed: FaceDetails length=', faceDetails?.length ?? 0);
        setStatusMessage('Царайны баталгаажуулалт амжилтгүй боллоо.');
        router.push('/camera/fail');
      }
    } catch (error: any) {
      console.error('Final capture error:', error.message, error.stack);
      setStatusMessage('Баталгаажуулалтын явцад алдаа гарлаа.');
      router.push('/camera/fail');
    }
  }, [webcamRef, router, isWebcamReady]);

  return (
    <div className="flex flex-col justify-center items-center h-screen relative space-y-6">
      <h2 className="text-center w-full mb-4 font-bold text-2xl">Царай таниулах</h2>
      <ul className="w-full max-w-md space-y-4">
        <li className="flex justify-center items-center">
          <div className="relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-72 h-96 rounded-full object-cover border-4 border-black shadow-lg bg-white"
              style={{
                transform: 'scaleX(-1)',
                borderRadius: '60% 60% 70% 70% / 55% 55% 80% 80%',
              }}
              onUserMedia={() => {
                console.log('Webcam initialized successfully');
                setIsWebcamReady(true);
                setStatusMessage('Царайгаа камерт ойртуулна уу.');
              }}
              onUserMediaError={(error) => {
                console.error('Webcam initialization error:', error);
                setIsWebcamReady(false);
                setHasPermission(false);
                setStatusMessage('Вэбкамын алдаа. Камер холбогдсон эсэхээ шалгана уу.');
                setTimeout(() => {
                  console.log('Redirecting to /camera/fail due to webcam error');
                  router.push('/camera/fail');
                }, 3000);
              }}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
              <span>{statusMessage}</span>
            </div>
          </div>
        </li>
        <li className="text-center w-full mb-4 text-gray-500">{statusMessage}</li>
        <li className="flex flex-row justify-between text-sm text-gray-500">
          <span>Камерын төлөв: {hasPermission === null ? 'Хүлээгдэж байна' : hasPermission ? 'Зөвшөөрөгдсөн' : 'Татгалзсан'}</span>
          <span>Барилтын төлөв: {capture ? 'Бүртгэгдсэн' : isWebcamReady && hasPermission ? 'Боловсруулж байна' : 'Хүлээж байна'}</span>
        </li>
      </ul>
    </div>
  );
};

export default CameraPage;