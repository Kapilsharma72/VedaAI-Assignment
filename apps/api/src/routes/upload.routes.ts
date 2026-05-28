import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import multer from 'multer';
import { processUpload } from '../services/file.service';
import { HttpError } from '../utils/errors';
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
router.use('/uploads', express.static(UPLOADS_DIR));
router.post('/', (req: Request, res: Response, next: NextFunction): void => {
    upload.single('file')(req, res, (err: unknown) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                next(new HttpError(413, 'File size exceeds the 10 MB limit.'));
                return;
            }
            next(new HttpError(400, err.message));
            return;
        }
        if (err) {
            next(err);
            return;
        }
        next();
    });
}, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await processUpload(req.file);
        res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
export default router;
