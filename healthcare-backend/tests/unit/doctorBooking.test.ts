import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

jest.mock("../../src/config/database", () => ({
  prisma: {
    staffProfile: { findFirst: jest.fn() },
    user: { findUniqueOrThrow: jest.fn() },
    patient: { findUnique: jest.fn() },
    address: { findUnique: jest.fn() },
    package: { findUniqueOrThrow: jest.fn() },
    city: { findUnique: jest.fn() },
    serviceType: { findUnique: jest.fn() },
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    bookingVisit: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bookingAssignment: { updateMany: jest.fn(), create: jest.fn() },
    notificationLog: { create: jest.fn(), updateMany: jest.fn() },
    payment: { findFirst: jest.fn(), create: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  },
}));
jest.mock("../../worker/notification.worker", () => ({
  notificationQueue: { add: jest.fn() },
}));
jest.mock("../../src/middleware/auth.middleware", () => ({
  authenticateToken(req: Request, _res: Response, next: NextFunction) {
    req.user = {
      sub: req.header("x-user") ?? "customer",
      role: (req.header("x-role") ?? "CUSTOMER") as "CUSTOMER",
      phone: "",
      session_id: "",
      iat: 0,
      exp: 0,
    };
    next();
  },
}));
jest.mock("../../src/middleware/idempotency.middleware", () => ({
  idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) =>
    next(),
}));

import visitRoutes from "../../src/routes/visit.routes";
import routes from "../../src/routes/booking.routes";
import { prisma } from "../../src/config/database";
import { notificationQueue } from "../../worker/notification.worker";
import { eligibleDoctorWhere } from "../../src/helper/doctorEligibility.helper";
import { AppError } from "../../src/utils/stateMachine";

const id = "00000000-0000-4000-8000-000000000001";
const visitId = "00000000-0000-4000-8000-000000000002";
const doctorId = "00000000-0000-4000-8000-000000000003";
const start = "2035-01-02T09:00:00+05:00";
const db = prisma as unknown as {
  [model: string]: { [method: string]: jest.Mock };
};
const initial = () => ({
  booking: {
    id,
    status: "PENDING_DOCTOR",
    cityId: id,
    patientId: id,
    preferredDoctorUserId: doctorId as string | null,
    serviceType: { code: "VISITING_DOCTOR", isActive: true },
    customerUserId: "customer",
    bookingNumber: "HH-1",
    requestedStartAt: new Date("2034-01-01T04:00:00Z"),
    confirmedAt: new Date(),
    confirmedByUserId: "admin",
    proposedStartAt: null as Date | null,
    package: { visitCount: 2, durationDays: 2, packageType: "MONTHLY" },
    address: { contactPhone: null },
    customer: { phone: "+923001234567" },
    _count: { reports: 0 },
  },
  profile: {
    userId: doctorId,
    cityId: id,
    verificationStatus: "VERIFIED",
    profileCompletedAt: new Date() as Date | null,
    isAvailable: true,
    user: {
      role: "STAFF",
      status: "ACTIVE",
      deletedAt: null as Date | null,
      phone: "+923000000001",
    },
    serviceTypes: [
      { serviceType: { code: "VISITING_DOCTOR", isActive: true } },
    ],
  },
  visits: [
    {
      id: visitId,
      bookingId: id,
      sequenceNo: 1,
      status: "SCHEDULED",
      assignedStaffUserId: null as string | null,
      checkInAt: null as Date | null,
      checkOutAt: null as Date | null,
      beforeConditionText: null as string | null,
      afterConditionText: null as string | null,
      visitNotes: null as string | null,
      _count: { reports: 0, reviews: 0 },
      scheduledStartAt: new Date("2034-01-01T04:00:00Z"),
    },
  ],
  assignments: [
    {
      bookingId: id,
      bookingVisitId: visitId,
      staffUserId: "staff",
      status: "ASSIGNED",
    },
  ],
  notifications: [] as {
    id: string;
    templateCode: string;
    recipient: string;
    status: string;
    templateData: Record<string, string>;
  }[],
  payments: [{ bookingId: id }],
});
let state = initial();
let inTransaction = false;
type Row = Record<string, unknown>;
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (key === "AND") return (value as Row[]).every((w) => matches(row, w));
    if (key === "OR") return (value as Row[]).some((w) => matches(row, w));
    if (value && typeof value === "object") {
      if ("in" in value) return (value.in as unknown[]).includes(row[key]);
      if ("not" in value) return row[key] !== value.not;
      if ("some" in value)
        return (row[key] as Row[]).some((v) => matches(v, value.some as Row));
      return !!row[key] && matches(row[key] as Row, value as Row);
    }
    return row[key] === value;
  });
}
const app = express();
app.use(express.json());
app.use("/bookings", routes);
app.use("/visits", visitRoutes);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) =>
  res
    .status(err instanceof ZodError ? 400 : err.statusCode ?? 500)
    .json({ error: { code: err.code ?? "VALIDATION_ERROR" } })
);

beforeEach(() => {
  jest.resetAllMocks();
  state = initial();
  (prisma.$transaction as jest.Mock).mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) => {
      if (typeof callback !== "function") return Promise.all(callback);
      const before = structuredClone(state);
      inTransaction = true;
      try {
        return await callback(prisma);
      } catch (err) {
        state = before;
        throw err;
      } finally {
        inTransaction = false;
      }
    }
  );
  db.staffProfile.findFirst.mockImplementation(
    async ({ where }: { where: Row }) =>
      matches(state.profile, where) ? state.profile : null
  );
  db.user.findUniqueOrThrow.mockResolvedValue({
    phone: "+923000000001",
    fullName: "Dr Test",
  });
  db.patient.findUnique.mockResolvedValue({ customerUserId: "customer" });
  db.address.findUnique.mockResolvedValue({
    customerUserId: "customer",
    cityId: id,
    contactPhone: "+923001234567",
  });
  db.package.findUniqueOrThrow.mockImplementation(async () => ({
    ...state.booking.package,
    isActive: true,
    serviceTypeId: id,
    priceAmount: 1000,
    currency: "PKR",
  }));
  db.city.findUnique.mockResolvedValue({ slug: "faisalabad" });
  db.serviceType.findUnique.mockImplementation(
    async () => state.booking.serviceType
  );
  (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: BigInt(1) }]);
  db.booking.create.mockImplementation(async ({ data }: { data: Row }) => {
    Object.assign(state.booking, data);
    return { ...state.booking };
  });
  db.booking.findMany.mockImplementation(async ({ where }: { where: Row }) =>
    matches({ ...state.booking, visits: state.visits }, where)
      ? [state.booking]
      : []
  );
  db.booking.count.mockImplementation(async ({ where }: { where: Row }) =>
    matches({ ...state.booking, visits: state.visits }, where) ? 1 : 0
  );
  db.booking.findUnique.mockImplementation(async () => ({
    ...state.booking,
    visits: state.visits,
  }));
  db.booking.findUniqueOrThrow.mockImplementation(async () => state.booking);
  db.booking.findFirst.mockImplementation(async ({ where }: { where: Row }) =>
    matches({ ...state.booking, visits: state.visits }, where) ? { id } : null
  );
  db.booking.update.mockImplementation(
    async ({ where, data }: { where: Row; data: Row }) => {
      if (!matches(state.booking, where))
        throw new Prisma.PrismaClientKnownRequestError("Changed", {
          code: "P2025",
          clientVersion: "5.22.0",
        });
      Object.assign(state.booking, data);
      return { ...state.booking };
    }
  );
  db.booking.updateMany.mockImplementation(
    async ({ where, data }: { where: Row; data: Row }) => {
      if (!matches(state.booking, where)) return { count: 0 };
      Object.assign(state.booking, data);
      return { count: 1 };
    }
  );
  db.bookingVisit.findMany.mockImplementation(
    async ({ where }: { where: Row }) =>
      state.visits.filter((v) => matches(v, where))
  );
  db.bookingVisit.updateMany.mockImplementation(
    async ({ where, data }: { where: Row; data: Row }) => {
      const found = state.visits.filter((v) => matches(v, where));
      found.forEach((v) => Object.assign(v, data));
      return { count: found.length };
    }
  );
  db.bookingVisit.createMany.mockImplementation(
    async ({ data }: { data: Row[] }) => {
      expect(inTransaction).toBe(true);
      data.forEach((v, i) =>
        state.visits.push({
          ...initial().visits[0],
          ...v,
          id: `new-${state.visits.length}-${i}`,
          assignedStaffUserId: null,
        })
      );
      return { count: data.length };
    }
  );
  db.bookingAssignment.updateMany.mockImplementation(
    async ({ data }: { data: Row }) => {
      state.assignments.forEach((a) => Object.assign(a, data));
      return { count: 1 };
    }
  );
  db.notificationLog.create.mockImplementation(
    async ({ data }: { data: Row }) => {
      expect(inTransaction).toBe(true);
      const row = {
        ...data,
        id: `notif-${state.notifications.length}`,
      } as (typeof state.notifications)[number];
      state.notifications.push(row);
      return row;
    }
  );
  db.notificationLog.updateMany.mockResolvedValue({ count: 0 });
  db.payment.findFirst.mockImplementation(
    async () => state.payments[0] ?? null
  );
  db.payment.create.mockImplementation(async () => {
    state.payments.push({ bookingId: id });
    return state.payments[0];
  });
  jest.mocked(notificationQueue.add).mockImplementation(async () => {
    expect(inTransaction).toBe(false);
    return null;
  });
});

const act = (action: string, role = "STAFF", user = doctorId, body = {}) =>
  request(app)
    .patch(`/bookings/${id}/${action}`)
    .set("x-role", role)
    .set("x-user", user)
    .send(body);
const create = (overrides = {}) =>
  request(app)
    .post("/bookings")
    .send({
      patientId: id,
      serviceTypeId: id,
      packageId: id,
      addressId: id,
      cityId: id,
      requestedStartAt: start.replace("+05:00", "Z"),
      preferredDoctorUserId: doctorId,
      source: "MOBILE",
      ...overrides,
    });

it("creates an eligible doctor request and notifies customer and doctor only after commit", async () => {
  state.visits = [];
  const result = await create();
  expect(result.status).toBe(201);
  expect(result.body.data).toMatchObject({
    status: "PENDING_DOCTOR",
    preferredDoctorUserId: doctorId,
  });
  expect(state.notifications.map((n) => n.templateCode)).toEqual([
    "BOOKING_RECEIVED",
    "DOCTOR_BOOKING_REQUESTED",
  ]);
  expect(notificationQueue.add).toHaveBeenCalledTimes(2);
});

it.each([
  "unverified",
  "incomplete",
  "unavailable",
  "wrong-city",
  "not-doctor",
  "inactive-service",
  "inactive-user",
  "wrong-role",
  "deleted-user",
])("rejects forged doctor selections: %s", async (reason) => {
  if (reason === "unverified") state.profile.verificationStatus = "PENDING";
  if (reason === "incomplete") state.profile.profileCompletedAt = null;
  if (reason === "unavailable") state.profile.isAvailable = false;
  if (reason === "wrong-city") state.profile.cityId = "other";
  if (reason === "not-doctor")
    state.profile.serviceTypes[0].serviceType.code = "NURSING";
  if (reason === "inactive-service")
    state.profile.serviceTypes[0].serviceType.isActive = false;
  if (reason === "inactive-user") state.profile.user.status = "SUSPENDED";
  if (reason === "wrong-role") state.profile.user.role = "CUSTOMER";
  if (reason === "deleted-user") state.profile.user.deletedAt = new Date();
  expect((await create()).status).toBe(403);
  expect(db.booking.create).not.toHaveBeenCalled();
  expect(notificationQueue.add).not.toHaveBeenCalled();
});

it("rejects doctor ID on another service and address/city tampering", async () => {
  state.booking.serviceType.code = "NURSING";
  expect((await create()).status).toBe(422);
  state.booking.serviceType.code = "VISITING_DOCTOR";
  db.address.findUnique.mockResolvedValue({
    customerUserId: "customer",
    cityId: "other",
  });
  expect((await create()).status).toBe(422);
  expect(db.booking.create).not.toHaveBeenCalled();
});

it("preserves normal admin-assigned doctor bookings without a preferred doctor", async () => {
  expect(
    (await create({ preferredDoctorUserId: undefined })).body.data.status
  ).toBe("PENDING");
});

it("restricts doctor requests and preferred-doctor reads to eligible staff", async () => {
  expect(
    (
      await request(app)
        .get("/bookings?doctorRequestsOnly=true")
        .set("x-role", "STAFF")
        .set("x-user", doctorId)
    ).body.data
  ).toHaveLength(1);
  expect(
    (
      await request(app)
        .get(`/bookings/${id}`)
        .set("x-role", "STAFF")
        .set("x-user", doctorId)
    ).status
  ).toBe(200);
  state.profile.verificationStatus = "REJECTED";
  expect(
    (
      await request(app)
        .get("/bookings?doctorRequestsOnly=true")
        .set("x-role", "STAFF")
        .set("x-user", doctorId)
    ).status
  ).toBe(403);
  expect(
    (
      await request(app)
        .get(`/bookings/${id}`)
        .set("x-role", "STAFF")
        .set("x-user", doctorId)
    ).status
  ).toBe(403);
  expect(
    (await request(app).get("/bookings?doctorRequestsOnly=true")).status
  ).toBe(403);
});

it("accepts a pending request into the admin queue and prevents duplicate acceptance", async () => {
  const res = await act("doctor-accept");
  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe("PENDING");
  expect(state.notifications[0].templateCode).toBe("DOCTOR_ACCEPTED");
  expect((await act("doctor-accept")).status).toBe(409);
  expect(state.notifications).toHaveLength(1);
});

it("proposes a future instant, lets only its customer accept, and replaces the visit schedule transactionally", async () => {
  expect(
    (
      await act("doctor-propose-time", "STAFF", doctorId, {
        proposedStartAt: start,
      })
    ).status
  ).toBe(200);
  expect(state.booking.status).toBe("TIME_PROPOSED");
  expect(state.notifications[0].templateCode).toBe("DOCTOR_TIME_PROPOSED");
  expect((await act("doctor-accept")).status).toBe(409);
  expect((await act("customer-accept-time", "CUSTOMER", "other")).status).toBe(
    403
  );
  const res = await act("customer-accept-time", "CUSTOMER", "customer");
  expect(res.status).toBe(200);
  expect(res.body.data).toMatchObject({
    status: "PENDING",
    proposedStartAt: null,
    requestedStartAt: "2035-01-02T04:00:00.000Z",
  });
  expect(state.visits[0].status).toBe("CANCELLED");
  const active = state.visits.filter((v) => v.status === "SCHEDULED");
  expect(active).toHaveLength(2);
  expect(active[0].scheduledStartAt.toISOString()).toBe(
    "2035-01-02T04:00:00.000Z"
  );
  expect(new Set(state.visits.map((v) => v.sequenceNo)).size).toBe(
    state.visits.length
  );
  expect(state.notifications[1].templateCode).toBe("DOCTOR_TIME_ACCEPTED");
  expect(
    (await act("customer-accept-time", "CUSTOMER", "customer")).status
  ).toBe(409);
});

it("lets the owner decline, cancels visits, and notifies the doctor", async () => {
  state.booking.status = "TIME_PROPOSED";
  state.booking.proposedStartAt = new Date(start);
  expect(
    (await act("customer-decline-time", "CUSTOMER", "customer")).status
  ).toBe(200);
  expect(state.booking.status).toBe("CANCELLED");
  expect(state.visits.every((v) => v.status === "CANCELLED")).toBe(true);
  expect(state.notifications[0].templateCode).toBe("DOCTOR_TIME_DECLINED");
});

it.each([
  "doctor-accept",
  "doctor-propose-time",
  "customer-accept-time",
  "customer-decline-time",
])("blocks unrelated users and wrong roles for %s", async (action) => {
  if (action.startsWith("customer")) {
    state.booking.status = "TIME_PROPOSED";
    state.booking.proposedStartAt = new Date(start);
  }
  const body = { proposedStartAt: start };
  expect((await act(action, "STAFF", "other", body)).status).toBe(403);
  expect((await act(action, "CUSTOMER", "other", body)).status).toBe(403);
  expect((await act(action, "ADMIN", "admin", body)).status).toBe(403);
  expect(db.booking.update).not.toHaveBeenCalled();
});

it.each(["invalid", "2020-01-01T00:00:00Z", "2035-02-30T00:00:00Z"])(
  "rejects invalid or expired proposals: %s",
  async (value) => {
    expect(
      (
        await act("doctor-propose-time", "STAFF", doctorId, {
          proposedStartAt: value,
        })
      ).status
    ).toBe(400);
    expect(db.booking.update).not.toHaveBeenCalled();
  }
);

it.each(["COMPLETED", "CANCELLED", "ASSIGNED", "IN_PROGRESS", "PENDING"])(
  "rejects replies in %s",
  async (status) => {
    state.booking.status = status;
    expect((await act("doctor-accept")).status).toBe(409);
  }
);

it("rejects stale time acceptance and clinical records without altering visits", async () => {
  state.booking.status = "TIME_PROPOSED";
  state.booking.proposedStartAt = new Date("2020-01-01");
  expect(
    (await act("customer-accept-time", "CUSTOMER", "customer")).status
  ).toBe(409);
  state.booking.proposedStartAt = new Date(start);
  state.visits[0]._count.reports = 1;
  expect(
    (await act("customer-accept-time", "CUSTOMER", "customer")).status
  ).toBe(409);
  expect(db.bookingVisit.createMany).not.toHaveBeenCalled();
});

it("rolls back a transition when notification storage fails", async () => {
  const before = structuredClone(state);
  db.notificationLog.create.mockRejectedValue(new Error("DB failure"));
  expect((await act("doctor-accept")).status).toBe(500);
  expect(state).toEqual(before);
  expect(notificationQueue.add).not.toHaveBeenCalled();
});

it("maps concurrent writes to a conflict without dispatching notifications", async () => {
  (prisma.$transaction as jest.Mock).mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("Concurrent write", {
      code: "P2034",
      clientVersion: "5.22.0",
    })
  );
  expect((await act("doctor-accept")).status).toBe(409);
  expect(notificationQueue.add).not.toHaveBeenCalled();
});

it("uses the same active, verified city/service criteria as the public doctor picker", () => {
  expect(matches(state.profile, eligibleDoctorWhere(id, true))).toBe(true);
  state.profile.isAvailable = false;
  expect(matches(state.profile, eligibleDoctorWhere(id, true))).toBe(false);
  expect(matches(state.profile, eligibleDoctorWhere(id))).toBe(true);
});

it("does not let an admin assign non-doctor staff to a visiting-doctor booking", async () => {
  state.booking.status = "CONFIRMED";
  (prisma.$queryRaw as jest.Mock)
    .mockResolvedValueOnce([state.visits[0]])
    .mockResolvedValueOnce([
      { userId: id, verificationStatus: "VERIFIED", isAvailable: true },
    ]);
  const res = await request(app)
    .post(`/bookings/${id}/assignments`)
    .set("x-role", "ADMIN")
    .send({ visitId, staffUserId: id });
  expect(res.status).toBe(403);
  expect(db.bookingAssignment.create).not.toHaveBeenCalled();
});

it("allows admin assignment of an eligible doctor after confirmation", async () => {
  state.booking.status = "CONFIRMED";
  (prisma.$queryRaw as jest.Mock)
    .mockResolvedValueOnce([state.visits[0]])
    .mockResolvedValueOnce([
      { userId: doctorId, verificationStatus: "VERIFIED", isAvailable: true },
    ]);
  db.bookingVisit.findFirst.mockResolvedValue(null);
  const res = await request(app)
    .post(`/bookings/${id}/assignments`)
    .set("x-role", "ADMIN")
    .send({ visitId, staffUserId: doctorId });
  expect(res.status).toBe(200);
  expect(state.booking.status).toBe("ASSIGNED");
  expect(state.notifications[0]).toMatchObject({
    templateCode: "STAFF_ASSIGNED",
    templateData: {
      scheduledDate: state.visits[0].scheduledStartAt.toISOString(),
    },
  });
});

it("requires a future proposal when the originally requested time has passed", async () => {
  state.booking.requestedStartAt = new Date("2020-01-01");
  expect((await act("doctor-accept")).status).toBe(409);
  expect(
    (
      await act("doctor-propose-time", "STAFF", doctorId, {
        proposedStartAt: start,
      })
    ).status
  ).toBe(200);
});

it.each(["ASSIGNED", "IN_PROGRESS", "COMPLETED"])(
  "preserves %s visits when replying to a proposal",
  async (status) => {
    state.booking.status = "TIME_PROPOSED";
    state.booking.proposedStartAt = new Date(start);
    state.visits[0].status = status;
    const before = structuredClone(state);
    expect(
      (await act("customer-accept-time", "CUSTOMER", "customer")).status
    ).toBe(409);
    expect(state).toEqual(before);
    expect(notificationQueue.add).not.toHaveBeenCalled();
  }
);

it("allows an off-duty eligible doctor to respond to an existing request", async () => {
  state.profile.isAvailable = false;
  expect((await act("doctor-accept")).status).toBe(200);
});

it("allows a customer to decline even after doctor eligibility is revoked", async () => {
  state.booking.status = "TIME_PROPOSED";
  state.booking.proposedStartAt = new Date(start);
  state.profile.verificationStatus = "REJECTED";
  expect(
    (await act("customer-decline-time", "CUSTOMER", "customer")).status
  ).toBe(200);
  expect(state.booking.status).toBe("CANCELLED");
});
