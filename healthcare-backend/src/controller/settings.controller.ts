import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';
import { NotFoundError } from '../utils/stateMachine';
import { pickParam } from '../helper/request.helper';

// ── Service Types ─────────────────────────────────────────────────────────────

const ServiceTypeSchema = z.object({
  code:        z.string().min(1).max(50).toUpperCase(),
  name:        z.string().min(1).max(100),
  description: z.string().optional(),
  isActive:    z.boolean().default(true),
});

// ── Packages ──────────────────────────────────────────────────────────────────

const PackageSchema = z.object({
  serviceTypeId: z.string().uuid(),
  cityId:        z.string().uuid().optional().nullable(),
  name:          z.string().min(1).max(120),
  packageType:   z.enum(['PER_VISIT', 'WEEKLY', 'MONTHLY']),
  durationDays:  z.coerce.number().int().min(1),
  visitCount:    z.coerce.number().int().min(1),
  priceAmount:   z.coerce.number().positive(),
  currency:      z.string().length(3).default('PKR'),
  description:   z.string().optional(),
  isActive:      z.boolean().default(true),
});

// ── Cities & Zones ────────────────────────────────────────────────────────────

const CitySchema = z.object({
  name:     z.string().min(1).max(100),
  slug:     z.string().min(1).max(120),
  isActive: z.boolean().default(true),
});

const ZoneSchema = z.object({
  name:     z.string().min(1).max(100),
  slug:     z.string().min(1).max(120),
  isActive: z.boolean().default(true),
});

export const settingsController = {

  // ── Service Types CRUD ───────────────────────────────────────────────────

  async listServiceTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await prisma.serviceType.findMany({ orderBy: { name: 'asc' } });
      success(res, items);
    } catch (err) { next(err); }
  },

  async createServiceType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = ServiceTypeSchema.parse(req.body);
      const item = await prisma.serviceType.create({ data });
      success(res, item, 201);
    } catch (err) { next(err); }
  },

  async updateServiceType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = pickParam(req, 'id');
      const data = ServiceTypeSchema.partial().parse(req.body);
      const item = await prisma.serviceType.update({ where: { id }, data });
      success(res, item);
    } catch (err) { next(err); }
  },

  // ── Packages CRUD ────────────────────────────────────────────────────────

  async listPackages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceTypeId = req.query['serviceTypeId'] as string | undefined;
      const items = await prisma.package.findMany({
        where: { ...(serviceTypeId && { serviceTypeId }) },
        include: { serviceType: { select: { name: true, code: true } } },
        orderBy: [{ serviceTypeId: 'asc' }, { priceAmount: 'asc' }],
      });
      success(res, items);
    } catch (err) { next(err); }
  },

  async createPackage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = PackageSchema.parse(req.body);
      const item = await prisma.package.create({ data });
      success(res, item, 201);
    } catch (err) { next(err); }
  },

  async updatePackage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = pickParam(req, 'id');
      const data = PackageSchema.partial().parse(req.body);
      const item = await prisma.package.update({ where: { id }, data });
      success(res, item);
    } catch (err) { next(err); }
  },

  async deletePackage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = pickParam(req, 'id');
      const pkg = await prisma.package.findUnique({ where: { id }, include: { _count: { select: { bookings: true } } } });
      if (!pkg) throw new NotFoundError('PACKAGE_NOT_FOUND');
      if (pkg._count.bookings > 0) {
        // Soft delete — just deactivate
        await prisma.package.update({ where: { id }, data: { isActive: false } });
      } else {
        await prisma.package.delete({ where: { id } });
      }
      success(res, { message: 'Package removed' });
    } catch (err) { next(err); }
  },

  // ── Cities CRUD ──────────────────────────────────────────────────────────

  async listCities(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cities = await prisma.city.findMany({
        include: { zones: { orderBy: { name: 'asc' } } },
        orderBy: { name: 'asc' },
      });
      success(res, cities);
    } catch (err) { next(err); }
  },

  async createCity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CitySchema.parse(req.body);
      const city = await prisma.city.create({ data });
      success(res, city, 201);
    } catch (err) { next(err); }
  },

  async updateCity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = pickParam(req, 'id');
      const data = CitySchema.partial().parse(req.body);
      const city = await prisma.city.update({ where: { id }, data });
      success(res, city);
    } catch (err) { next(err); }
  },

  // ── Zones CRUD ───────────────────────────────────────────────────────────

  async createZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cityId = pickParam(req, 'cityId');
      const data = ZoneSchema.parse(req.body);
      const zone = await prisma.zone.create({ data: { ...data, cityId } });
      success(res, zone, 201);
    } catch (err) { next(err); }
  },

  async updateZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = pickParam(req, 'zoneId');
      const data = ZoneSchema.partial().parse(req.body);
      const zone = await prisma.zone.update({ where: { id }, data });
      success(res, zone);
    } catch (err) { next(err); }
  },

  async deleteZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = pickParam(req, 'zoneId');
      await prisma.zone.delete({ where: { id } });
      success(res, { message: 'Zone removed' });
    } catch (err) { next(err); }
  },
};
