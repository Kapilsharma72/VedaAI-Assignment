import path from 'path';
import fs from 'fs';
import fileType from 'file-type';
import pdfParse from 'pdf-parse';
import { HttpError } from '../utils/errors';
const MAX_FILE_SIZE = 10485760;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
export interface ProcessUploadResult {
    uploadedFileUrl: string | null;
    uploadedFileText: string | null;
}
export async function processUpload(file: Express.Multer.File | undefined): Promise<ProcessUploadResult> {
    if (!file) {
        throw new HttpError(400, 'No file was uploaded. Please include a file field.');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new HttpError(413, `File size ${file.size} bytes exceeds the maximum allowed size of ${MAX_FILE_SIZE} bytes (10 MB).`);
    }
    const detected = await fileType.fromBuffer(file.buffer);
    const mimeType = detected?.mime as string | undefined;
    if (!mimeType || !(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
        throw new HttpError(415, `Unsupported file type "${mimeType ?? 'unknown'}". ` +
            `Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}.`);
    }
    const allowedMime = mimeType as AllowedMimeType;
    if (allowedMime === 'application/pdf') {
        return processPdf(file.buffer);
    }
    return processImage(file.buffer, file.originalname);
}
async function processPdf(buffer: Buffer): Promise<ProcessUploadResult> {
    try {
        const data = await pdfParse(buffer);
        return {
            uploadedFileUrl: null,
            uploadedFileText: data.text,
        };
    }
    catch {
        throw new HttpError(422, 'Could not extract text from the uploaded PDF. ' +
            'The file may be encrypted, corrupt, or contain only scanned images.');
    }
}
async function processImage(buffer: Buffer, originalname: string): Promise<ProcessUploadResult> {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${Date.now()}-${originalname}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.promises.writeFile(filePath, buffer);
    return {
        uploadedFileUrl: `/uploads/${filename}`,
        uploadedFileText: null,
    };
}
