import { prisma } from '../db.js';

// Fire-and-forget: an audit write failure must not fail the request.
export function audit(req, action, userId = null, meta = undefined) {
  prisma.auditLog
    .create({ data: { action, userId, ip: req.ip, meta } })
    .catch((err) => req.log?.error({ err }, 'audit write failed'));
}
