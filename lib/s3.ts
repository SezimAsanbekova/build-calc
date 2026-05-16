import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Инициализация S3 клиента
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_URL || undefined, // Для совместимых с S3 хранилищ
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Для совместимых с S3 хранилищ
});

const BUCKET_NAME = process.env.BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || '';
const PUBLIC_URL = process.env.S3_URL 
  ? `${process.env.S3_URL}/${BUCKET_NAME}` 
  : process.env.AWS_S3_PUBLIC_URL || '';

/**
 * Загрузка файла в S3
 * @param file - File объект из формы
 * @param folder - папка в S3 (например, 'materials', 'avatars')
 * @returns URL загруженного файла
 */
export async function uploadToS3(
  file: File,
  folder: string = 'materials'
): Promise<string> {
  try {
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Конвертируем File в Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Загружаем в S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // Убираем ACL, так как не все S3-совместимые хранилища его поддерживают
    });

    await s3Client.send(command);

    // Возвращаем публичный URL
    return `${PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error('Ошибка загрузки в S3:', error);
    throw new Error('Не удалось загрузить файл');
  }
}

/**
 * Удаление файла из S3
 * @param fileUrl - полный URL файла
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    // Извлекаем ключ файла из URL
    const key = fileUrl.replace(`${PUBLIC_URL}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Ошибка удаления из S3:', error);
    throw new Error('Не удалось удалить файл');
  }
}

/**
 * Проверка, является ли URL файлом из S3
 */
export function isS3Url(url: string): boolean {
  return url.includes(BUCKET_NAME) || url.startsWith(PUBLIC_URL);
}
