import type { APIRoute } from "astro";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import path from "node:path";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return new Response("no file", { status: 400 });

  const accountId = import.meta.env.R2_ACCOUNT_ID;
  const accessKey = import.meta.env.R2_ACCESS_KEY_ID;
  const secretKey = import.meta.env.R2_SECRET_ACCESS_KEY;
  const bucket = import.meta.env.R2_BUCKET_NAME;
  const publicUrl = import.meta.env.R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev

  if (!accountId || !accessKey || !secretKey || !bucket || !publicUrl) {
    return new Response("R2 not configured", { status: 500 });
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  const ext = path.extname(file.name) || ".jpg";
  const key = `blog/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const url = `${publicUrl.replace(/\/$/, "")}/${key}`;
  return new Response(JSON.stringify({ url }), {
    headers: { "Content-Type": "application/json" },
  });
};
