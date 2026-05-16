import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';

/**
 * POST /api/admin/upload
 * Загрузка изображения в S3
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'materials';

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Недопустимый тип файла. Разрешены: JPG, PNG, WEBP' },
        { status: 400 }
      );
    }

    // Проверка размера файла (макс 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимум 5MB' },
        { status: 400 }
      );
    }

    // Загружаем в S3
    const imageUrl = await uploadToS3(file, folder);

    return NextResponse.json(
      {
        success: true,
        url: imageUrl,
        message: 'Файл успешно загружен',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке файла' },
      { status: 500 }
    );
  }
}
