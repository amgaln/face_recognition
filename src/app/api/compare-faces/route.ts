import { NextResponse } from 'next/server';
import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('API /api/compare-faces hit: POST');

  try {
    // Parse request body
    const body = await req.json();
    console.log('Request body:', {
      sourceImage: body.sourceImage?.slice(0, 20) + '...',
      targetImage: body.targetImage?.slice(0, 20) + '...',
      sourceImageLength: body.sourceImage?.length,
      targetImageLength: body.targetImage?.length,
    });
    const { sourceImage, targetImage } = body;

    // Validate inputs
    if (!sourceImage || !targetImage) {
      console.error('Missing sourceImage or targetImage in request body');
      return NextResponse.json({ message: 'Зураг дутуу байна.' }, { status: 400 });
    }

    // Validate base64 format
    if (
      typeof sourceImage !== 'string' ||
      typeof targetImage !== 'string' ||
      !sourceImage.match(/^([A-Za-z0-9+/=]+$)/) ||
      !targetImage.match(/^([A-Za-z0-9+/=]+$)/)
    ) {
      console.error('Invalid base64 image format');
      return NextResponse.json({ message: 'Invalid base64 image format' }, { status: 400 });
    }

    // Verify environment variables
    if (
      !process.env.AWS_REGION ||
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY
    ) {
      console.error('Missing AWS environment variables', {
        region: !!process.env.AWS_REGION,
        accessKey: !!process.env.AWS_ACCESS_KEY_ID,
        secretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      });
      return NextResponse.json(
        { message: 'Server configuration error: Missing AWS credentials' },
        { status: 500 }
      );
    }

    // Initialize Rekognition client
    const client = new RekognitionClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Convert base64 to buffers
    let sourceBuffer: Buffer, targetBuffer: Buffer;
    try {
      sourceBuffer = Buffer.from(sourceImage, 'base64');
      targetBuffer = Buffer.from(targetImage, 'base64');
      console.log('Buffer lengths:', {
        sourceBufferLength: sourceBuffer.length,
        targetBufferLength: targetBuffer.length,
      });
    } catch (error) {
      console.error('Failed to decode base64 images:', error);
      return NextResponse.json({ message: 'Invalid base64 image data' }, { status: 400 });
    }

    // Check for JPEG/PNG headers
    const isJpeg = (buffer: Buffer) => buffer.slice(0, 2).toString('hex') === 'ffd8';
    const isPng = (buffer: Buffer) => buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
    if (!isJpeg(sourceBuffer) && !isPng(sourceBuffer)) {
      console.error('Source image is not JPEG or PNG');
      return NextResponse.json({ message: 'Source image must be JPEG or PNG' }, { status: 400 });
    }
    if (!isJpeg(targetBuffer) && !isPng(targetBuffer)) {
      console.error('Target image is not JPEG or PNG');
      return NextResponse.json({ message: 'Target image must be JPEG or PNG' }, { status: 400 });
    }

    const params = {
      SourceImage: { Bytes: sourceBuffer },
      TargetImage: { Bytes: targetBuffer },
      SimilarityThreshold: 70,
    };

    const command = new CompareFacesCommand(params);
    console.log('CompareFaces command:', command);
    const response = await client.send(command);
    console.log('Rekognition response:', response);

    // Format response to match AWS Rekognition structure
    const faceMatches = response.FaceMatches || [];
    const unmatchedFaces = response.UnmatchedFaces || [];
    const formattedMatches = faceMatches.map((data) => ({
      Similarity: data.Similarity,
      Face: {
        BoundingBox: data.Face?.BoundingBox
          ? {
              Left: data.Face.BoundingBox.Left,
              Top: data.Face.BoundingBox.Top,
              Width: data.Face.BoundingBox.Width,
              Height: data.Face.BoundingBox.Height,
            }
          : null,
        Confidence: data.Face?.Confidence,
      },
    }));

    const formattedUnmatched = unmatchedFaces.map((face) => ({
      Face: {
        BoundingBox: face.BoundingBox
          ? {
              Left: face.BoundingBox.Left,
              Top: face.BoundingBox.Top,
              Width: face.BoundingBox.Width,
              Height: face.BoundingBox.Height,
            }
          : null,
        Confidence: face.Confidence,
      },
    }));

    if (formattedMatches.length === 0) {
      console.log('No face matches found');
      return NextResponse.json(
        {
          message: 'Царай таарахгүй байна.',
          FaceMatches: [],
          UnmatchedFaces: formattedUnmatched,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        FaceMatches: formattedMatches,
        UnmatchedFaces: formattedUnmatched,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('CompareFaces API error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: 'Серверийн алдаа.', error: error.message },
      { status: 500 }
    );
  }
}