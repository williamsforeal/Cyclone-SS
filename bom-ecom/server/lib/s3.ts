import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

function getConfig() {
  const bucket = process.env.AWS_S3_BUCKET;
  let region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing AWS S3 configuration (AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
  }
  if (region.startsWith("region=")) {
    region = region.replace("region=", "");
  }
  return { bucket, region, accessKeyId, secretAccessKey };
}

function getClient() {
  const { region, accessKeyId, secretAccessKey } = getConfig();
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function buildUrl(key: string) {
  const { bucket, region } = getConfig();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function listTemplates(prefix?: string) {
  const { bucket } = getConfig();
  const client = getClient();
  const fullPrefix = prefix ? `templates/${prefix}` : "templates/";
  const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: fullPrefix });
  const response = await client.send(command);
  return (response.Contents || []).map((obj) => ({
    key: obj.Key!,
    lastModified: obj.LastModified?.toISOString() ?? null,
    size: obj.Size ?? 0,
    url: buildUrl(obj.Key!),
  }));
}

export async function listRenders(prefix?: string) {
  const { bucket } = getConfig();
  const client = getClient();
  const fullPrefix = prefix ? `renders/${prefix}` : "renders/";
  const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: fullPrefix });
  const response = await client.send(command);
  return (response.Contents || []).map((obj) => ({
    key: obj.Key!,
    lastModified: obj.LastModified?.toISOString() ?? null,
    size: obj.Size ?? 0,
    url: buildUrl(obj.Key!),
  }));
}

export async function getSignedUrl(key: string) {
  const { bucket } = getConfig();
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return awsGetSignedUrl(client, command, { expiresIn: 3600 });
}

export async function uploadToS3(buffer: Buffer, key: string, contentType: string) {
  const { bucket } = getConfig();
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await client.send(command);
  return { key, url: buildUrl(key) };
}

export async function deleteFromS3(key: string) {
  const { bucket } = getConfig();
  const client = getClient();
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await client.send(command);
}
