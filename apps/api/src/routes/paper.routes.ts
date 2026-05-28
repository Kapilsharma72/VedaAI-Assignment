import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import redis from '../config/redis';
import { GeneratedPaper } from '../models/paper.model';
import { Assignment } from '../models/assignment.model';
import logger from '../config/logger';

const router = Router();

router.get(
  '/:id/paper',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const assignmentId = req.params.id;
    const cacheKey = `paper:${assignmentId}`;

    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }
      if (assignment.userId.toString() !== req.userId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const cached = await redis.get(cacheKey);

      if (cached !== null) {
        logger.info('Paper cache hit', { assignmentId });
        const paper = JSON.parse(cached);
        res.status(200).json({ success: true, data: paper });
        return;
      }

      logger.info('Paper cache miss, fetching from MongoDB', { assignmentId });
      const paper = await GeneratedPaper.findOne({ assignmentId });

      if (!paper) {
        res.status(404).json({ success: false, message: 'Paper not found' });
        return;
      }

      res.status(200).json({ success: true, data: paper });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
