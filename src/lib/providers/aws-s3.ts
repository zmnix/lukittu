import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import 'server-only';
import { logger } from '../utils/logger';

const s3Client = new S3Client({
  endpoint: process.env.CONTABO_STORAGE_ENDPOINT,
  region: 'default',
  credentials: {
    accessKeyId: process.env.CONTABO_ACCESS_KEY!,
    secretAccessKey: process.env.CONTABO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export const deleteFileFromS3 = async (bucket: string, fileKey: string) => {
  try {
    const deleteParams: DeleteObjectCommandInput = {
      Bucket: bucket,
      Key: fileKey,
    };
    return s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (error) {
    logger.error('Error deleting file from object storage:', error);
  }
};

export const uploadFileToS3 = async (
  bucket: string,
  fileKey: string,
  fileBuffer: Buffer,
  contentType: string,
) => {
  try {
    const uploadParams: PutObjectCommandInput = {
      Bucket: bucket,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
    };
    return s3Client.send(new PutObjectCommand(uploadParams));
  } catch (error) {
    logger.error('Error uploading file to object storage:', error);
  }
};
