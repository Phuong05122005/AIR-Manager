/**
 * routes/kits.js
 * THU TU ROUTE QUAN TRONG: cac route cu the phai dat TRUOC /:id
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Kit = require('../models/Kit');
const AuditLog = require('../models/AuditLog');
const { assignCodesToComponents } = require('../utils/componentCode');

// GET /api/kits
router.get('/', async (req, res, next) => {
  try {
    const kits = await Kit.find().sort({ createdAt: -1 });
    res.json({ success: true, count: kits.length, data: kits });
  } catch (error) {
    next(error);
  }
});

// GET /api/kits/qr/:token — PHAI DAT TRUOC /:id
router.get('/qr/:token', async (req, res, next) => {
  try {
    const kit = await Kit.findOne({ qrToken: req.params.token });
    if (!kit) {
      res.status(404);
      throw new Error('Khong tim thay hop kit voi ma QR nay.');
    }
    res.json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// POST /api/kits/migrate-tokens — sinh qrToken cho kit cu, PHAI DAT TRUOC /:id
router.post('/migrate-tokens', async (req, res, next) => {
  try {
    const kitsWithoutToken = await Kit.find({
      $or: [
        { qrToken: { $exists: false } },
        { qrToken: null },
        { qrToken: '' },
      ]
    });

    if (kitsWithoutToken.length === 0) {
      return res.json({
        success: true,
        message: 'Tat ca hop kit da co qrToken.',
        updated: 0,
      });
    }

    const results = [];
    for (const kit of kitsWithoutToken) {
      kit.qrToken = crypto.randomUUID();
      await kit.save();
      results.push({ name: kit.name, qrToken: kit.qrToken });
    }

    res.json({
      success: true,
      message: `Da sinh qrToken cho ${results.length} hop kit thanh cong!`,
      updated: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/kits/:id
router.get('/:id', async (req, res, next) => {
  try {
    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Khong tim thay hop kit');
    }
    res.json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// POST /api/kits
router.post('/', async (req, res, next) => {
  try {
    const { name, topic, status, components, operator } = req.body;

    const kit = new Kit({
      name,
      topic,
      status: status || 'San sang',
      qrToken: crypto.randomUUID(),
      components: assignCodesToComponents(components || []),
    });

    const saved = await kit.save();

    const log = new AuditLog({
      actionType: 'CREATE_KIT',
      targetType: 'KIT',
      targetId: saved._id.toString(),
      description: `Da tao moi hop kit "${saved.name}" - QR: ${saved.qrToken}`,
      operator: operator || 'Quan tri vien',
      details: saved
    });
    await log.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      error.message = 'Ten hop kit nay da ton tai tren he thong';
    }
    next(error);
  }
});

// PUT /api/kits/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, topic, status, components, operator } = req.body;

    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Khong tim thay hop kit de chinh sua');
    }

    const oldSnapshot = JSON.parse(JSON.stringify(kit));

    if (name !== undefined) kit.name = name;
    if (topic !== undefined) kit.topic = topic;
    if (status !== undefined) kit.status = status;
    if (components !== undefined) kit.components = assignCodesToComponents(components);
    // qrToken KHONG thay doi

    const updated = await kit.save();

    let actionType = 'UPDATE_KIT';
    let changeDesc = `Da cap nhat thong tin hop kit "${updated.name}"`;
    if (components !== undefined) {
      actionType = 'UPDATE_COMPONENTS';
      changeDesc = `Da cap nhat linh kien cua hop kit "${updated.name}" (${updated.components.length} linh kien)`;
    }

    const log = new AuditLog({
      actionType,
      targetType: 'KIT',
      targetId: updated._id.toString(),
      description: changeDesc,
      operator: operator || 'Quan tri vien',
      details: { before: oldSnapshot, after: updated }
    });
    await log.save();

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/kits/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { operator } = req.query;
    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Khong tim thay hop kit de xoa');
    }

    await Kit.findByIdAndDelete(req.params.id);

    const log = new AuditLog({
      actionType: 'DELETE_KIT',
      targetType: 'KIT',
      targetId: kit._id.toString(),
      description: `Da xoa hop kit "${kit.name}". Du lieu da luu vao nhat ky.`,
      operator: operator || 'Quan tri vien',
      details: kit
    });
    await log.save();

    res.json({
      success: true,
      message: `Da xoa hop kit "${kit.name}" thanh cong.`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
