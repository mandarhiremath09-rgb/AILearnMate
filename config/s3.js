const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (bucket, key, body, contentType) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return {
      url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key,
    };
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}`);
  }
};

const getSignedUrlForS3 = async (bucket, key, expiresIn = 3600) => {
  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const url = await getSignedUrl(s3Client, new GetObjectCommand(params), { expiresIn });
    return url;
  } catch (err) {
    throw new Error(`Failed to generate signed URL: ${err.message}`);
  }
};

const deleteFromS3 = async (bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (err) {
    throw new Error(`S3 delete failed: ${err.message}`);
  }
};

module.exports = {
  s3Client,
  uploadToS3,
  getSignedUrlForS3,
  deleteFromS3,
};
