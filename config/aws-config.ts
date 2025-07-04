import AWS from 'aws-sdk';

AWS.config.update({

    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!, 
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    region: 'us-east-1',
});

export const rekognition = new AWS.Rekognition();