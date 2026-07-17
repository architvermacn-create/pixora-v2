import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(
  source: string | Buffer,
  options: { folder?: string; resource_type?: 'image' | 'video' | 'raw' } = {}
) {
  const uploadOptions = {
    folder: options.folder || 'pixora-v2',
    resource_type: options.resource_type || 'auto' as any,
  };

  if (typeof source === 'string') {
    return cloudinary.uploader.upload(source, uploadOptions);
  } else {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
        if (err) reject(err); else resolve(result);
      });
      stream.end(source);
    });
  }
}

export { cloudinary };
