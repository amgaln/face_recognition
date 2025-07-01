import { NextResponse } from 'next/server';
import { RekognitionClient, DetectFacesCommand, Attribute } from '@aws-sdk/client-rekognition';

export const runtime = 'nodejs'; // Ensure Node.js runtime for AWS SDK
export const maxDuration = 30; // Increase timeout for Rekognition API calls

export async function POST(req: Request) {
  console.log('API /api/rekognition hit: POST');

  try {
    // Parse request body
    const body = await req.json();
    const { base64Image } = body;

    if (!base64Image) {
      console.error('Missing base64Image in request body');
      return NextResponse.json({ message: 'Missing base64Image' }, { status: 400 });
    }

    // Validate base64 string
    if (typeof base64Image !== 'string' || !base64Image.match(/^([A-Za-z0-9+/=]+)$/)) {
      console.error('Invalid base64Image format');
      return NextResponse.json({ message: 'Invalid base64Image format' }, { status: 400 });
    }

    // Verify environment variables
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('Missing AWS environment variables', {
        region: !!process.env.AWS_REGION,
        accessKey: !!process.env.AWS_ACCESS_KEY_ID,
        secretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      });
      return NextResponse.json({ message: 'Server configuration error: Missing AWS credentials' }, { status: 500 });
    }

    // Initialize Rekognition client
    const client = new RekognitionClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Convert base64 to buffer
    let imageBuffer;
    try {
      imageBuffer = Buffer.from(base64Image, 'base64');
    } catch (error) {
      console.error('Failed to decode base64 image:', error);
      return NextResponse.json({ message: 'Invalid base64 image data' }, { status: 400 });
    }

    const input = {
      Image: { Bytes: imageBuffer },
      Attributes: [Attribute.ALL],
    };

    const command = new DetectFacesCommand(input);
    const response = await client.send(command);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Rekognition API error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: 'Face detection failed', error: error.message },
      { status: 500 }
    );
  }
}