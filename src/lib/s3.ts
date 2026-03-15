import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    forcePathStyle: true, // required for MinIO / non-AWS S3-compatible
  });
}

const BUCKET = process.env.S3_BUCKET || "documents";

/**
 * Upload a buffer to S3. Returns the object key stored in the bucket.
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType = "application/pdf"
): Promise<string> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

/**
 * Generate a presigned GET URL that expires in `expiresIn` seconds (default 15 min).
 */
export async function getPresignedUrl(
  key: string,
  expiresIn = 900
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete an object from S3 by its key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
