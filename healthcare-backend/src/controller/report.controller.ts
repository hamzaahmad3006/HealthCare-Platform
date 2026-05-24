import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { getPresignedUploadUrl, deleteFile, signDeliveryUrl } from '../helper/cloudinary.helper';
import { renderTemplate } from '../helper/template.helper';
import { success, paginated } from '../helper/response.helper';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/stateMachine';
import { notificationQueue } from '../../worker/notification.worker';
import { pickParam } from '../helper/request.helper';

const CreateReportSchema = z.object({
  bookingId: z.string().uuid(),
  bookingVisitId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  reportType: z.enum(['LAB_RESULT', 'PRESCRIPTION', 'VISIT_NOTE', 'PROGRESS_IMAGE', 'OTHER']),
  title: z.string().min(1).max(150),
  notes: z.string().optional(),
  isVisibleToCustomer: z.boolean().default(true),
});

const PresignSchema = z.object({
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  fileSizeBytes: z.number().int().positive(),
});

const ConfirmFileSchema = z.object({
  fileKey: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  checksumSha256: z.string().optional(),
});

const ReportListQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  reportType: z.enum(['LAB_RESULT', 'PRESCRIPTION', 'VISIT_NOTE', 'PROGRESS_IMAGE', 'OTHER']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

function canAccessReport(
  role: string,
  userId: string,
  report: { uploadedByUserId: string; isVisibleToCustomer: boolean; booking: { customerUserId: string } },
): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'STAFF') return report.uploadedByUserId === userId;
  if (role === 'CUSTOMER') return report.isVisibleToCustomer && report.booking.customerUserId === userId;
  return false;
}

export const reportController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const data = CreateReportSchema.parse(req.body);
      const report = await prisma.report.create({
        data: { ...data, uploadedByUserId: req.user.sub },
      });

      success(res, report, 201);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { patientId, bookingId, reportType, page, limit } = ReportListQuerySchema.parse(req.query);

      const where: Prisma.ReportWhereInput = {
        ...(req.user.role === 'STAFF' && { uploadedByUserId: req.user.sub }),
        ...(req.user.role === 'CUSTOMER' && {
          isVisibleToCustomer: true,
          booking: { customerUserId: req.user.sub },
        }),
        ...(patientId && { patientId }),
        ...(bookingId && { bookingId }),
        ...(reportType && { reportType }),
      };

      const [reports, total] = await prisma.$transaction([
        prisma.report.findMany({
          where,
          include: {
            files: true,
            patient: { select: { fullName: true } },
            booking: { select: { bookingNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.report.count({ where }),
      ]);

      const serialized = reports.map((r) => ({
        ...r,
        files: r.files.map((f) => ({
          ...f,
          fileSizeBytes: f.fileSizeBytes.toString(),
          fileUrl: signDeliveryUrl(f.fileUrl, f.mimeType),
        })),
      }));
      paginated(res, serialized, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const report = await prisma.report.findUnique({
        where: { id: pickParam(req, 'id') },
        include: { files: true, booking: { select: { customerUserId: true } } },
      });
      if (!report) throw new NotFoundError('REPORT_NOT_FOUND');

      if (!canAccessReport(req.user.role, req.user.sub, report)) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const signed = {
        ...report,
        files: report.files.map((f) => ({
          ...f,
          fileSizeBytes: f.fileSizeBytes.toString(),
          fileUrl: signDeliveryUrl(f.fileUrl, f.mimeType),
        })),
      };
      success(res, signed);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const report = await prisma.report.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!report) throw new NotFoundError('REPORT_NOT_FOUND');

      if (req.user.role !== 'ADMIN' && report.uploadedByUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const data = CreateReportSchema.partial().parse(req.body);
      const updated = await prisma.report.update({ where: { id: report.id }, data });
      success(res, updated);
    } catch (err) { next(err); }
  },

  async presignFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const report = await prisma.report.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!report) throw new NotFoundError('REPORT_NOT_FOUND');

      if (req.user.role !== 'ADMIN' && report.uploadedByUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const { mimeType, fileSizeBytes } = PresignSchema.parse(req.body);
      const result = await getPresignedUploadUrl(`reports/${report.id}`, mimeType, fileSizeBytes);
      success(res, result);
    } catch (err) { next(err); }
  },

  async confirmFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const report = await prisma.report.findUnique({
        where: { id: pickParam(req, 'id') },
        include: {
          booking: {
            select: {
              customerUserId: true,
              bookingNumber: true,
              address: { select: { contactPhone: true } },
              customer: { select: { phone: true } },
            },
          },
          patient: { select: { fullName: true } },
        },
      });
      if (!report) throw new NotFoundError('REPORT_NOT_FOUND');

      if (req.user.role !== 'ADMIN' && report.uploadedByUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const data = ConfirmFileSchema.parse(req.body);
      const file = await prisma.reportFile.create({
        data: {
          reportId: report.id,
          fileProvider: 'CLOUDINARY',
          fileKey: data.fileKey,
          fileUrl: data.fileUrl,
          mimeType: data.mimeType,
          fileSizeBytes: BigInt(data.fileSizeBytes),
          checksumSha256: data.checksumSha256,
        },
      });

      if (report.isVisibleToCustomer) {
        const notifLog = await prisma.notificationLog.create({
          data: {
            bookingId: report.bookingId,
            templateCode: 'REPORT_AVAILABLE',
            recipient: report.booking.address.contactPhone ?? report.booking.customer.phone,
            renderedContent: renderTemplate('REPORT_AVAILABLE', {
              patientName: report.patient.fullName,
              bookingNumber: report.booking.bookingNumber,
            }),
            status: 'PENDING',
          },
        });
        await notificationQueue.add('send', { notificationLogId: notifLog.id }).catch(() => null);
      }

      success(res, { ...file, fileSizeBytes: file.fileSizeBytes.toString() }, 201);
    } catch (err) { next(err); }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = await prisma.reportFile.findUnique({ where: { id: pickParam(req, 'fileId') } });
      if (!file) throw new NotFoundError('FILE_NOT_FOUND');

      await deleteFile(file.fileKey, file.mimeType);
      await prisma.reportFile.delete({ where: { id: file.id } });

      success(res, { message: 'File deleted' });
    } catch (err) { next(err); }
  },
};
