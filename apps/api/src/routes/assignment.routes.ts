import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { authenticate } from '../middleware/auth.middleware';
import * as assignmentService from '../services/assignment.service';

const router = Router();

const createAssignmentSchema = Joi.object({
  title: Joi.string().max(200).required(),
  subject: Joi.string().max(100).required(),
  class: Joi.string().max(50).required(),
  schoolName: Joi.string().max(200).required(),
  dueDate: Joi.date().iso().required(),
  timeAllowed: Joi.number().integer().min(1).max(300).required(),
  instructions: Joi.string().max(1000).allow(''),
  additionalInfo: Joi.string().max(2000).allow(''),
  questionTypes: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().required(),
        count: Joi.number().integer().min(1).required(),
        marks: Joi.number().integer().min(1).required(),
      }),
    )
    .min(1)
    .required(),
  uploadedFileUrl: Joi.string().uri().allow(null),
  uploadedFileText: Joi.string().allow(null, ''),
});

function formatJoiErrors(error: Joi.ValidationError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const detail of error.details) {
    const key = detail.path.length > 0 ? String(detail.path[0]) : 'unknown';
    if (!errors[key]) {
      errors[key] = detail.message.replace(/['"]/g, '');
    }
  }
  return errors;
}

router.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error, value } = createAssignmentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatJoiErrors(error),
      });
      return;
    }

    try {
      const assignment = await assignmentService.create(req.userId!, value);
      res.status(201).json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await assignmentService.list(req.userId!);
      res.status(200).json({ success: true, data: assignments });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignment = await assignmentService.getById(
        req.userId!,
        req.params.id,
      );
      res.status(200).json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await assignmentService.deleteById(req.userId!, req.params.id);
      res.status(200).json({ success: true, message: 'Assignment deleted' });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/regenerate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignment = await assignmentService.regenerate(
        req.userId!,
        req.params.id,
      );
      res.status(200).json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
