import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.ts";

// A configuração global já resolve autenticação, timestamp e assinatura
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
): Promise<string> {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw Object.assign(
      new Error("O serviço de upload de imagens não está configurado."),
      { statusCode: 503 },
    );
  }

  return new Promise((resolve, reject) => {
    // O SDK injeta api_key, timestamp e signature automaticamente.
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result || !result.secure_url) {
          reject(new Error("O Cloudinary não retornou a URL da imagem."));
          return;
        }
        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
}
