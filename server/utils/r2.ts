import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (s3Client) return s3Client

  const config = useRuntimeConfig()
  if (!config.r2AccountId || !config.r2AccessKeyId || !config.r2SecretAccessKey) {
    throw new Error('[R2] Missing R2 configuration. Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars.')
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  return s3Client
}

export function useR2() {
  const config = useRuntimeConfig()
  const bucket = config.r2BucketName
  const publicUrl = config.r2PublicUrl

  return {
    /**
     * Upload a file to the public R2 bucket.
     * Returns the public URL of the uploaded file.
     */
    upload: async (
      key: string,
      body: Buffer | Uint8Array,
      contentType: string
    ): Promise<{ key: string; url: string }> => {
      const client = getS3Client()
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      )
      return { key, url: `${publicUrl}/${key}` }
    },

    /**
     * Delete a file from the R2 bucket by its key.
     */
    delete: async (key: string): Promise<void> => {
      const client = getS3Client()
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      )
    },

    /**
     * Get the public URL for any key (no auth required — public bucket).
     */
    getPublicUrl: (key: string): string => `${publicUrl}/${key}`,
  }
}
