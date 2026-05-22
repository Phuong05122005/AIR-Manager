/**
 * scripts/migrateQrTokens.js
 *
 * Migration script: Sinh qrToken cố định cho tất cả hộp kit cũ
 * chưa có qrToken trong MongoDB.
 *
 * Chạy một lần duy nhất:
 *   node scripts/migrateQrTokens.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
const Kit = require('../src/models/Kit');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/air-components';

async function migrateQrTokens() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Tìm tất cả kit chưa có qrToken
    const kitsWithoutToken = await Kit.find({
      $or: [
        { qrToken: { $exists: false } },
        { qrToken: null },
        { qrToken: '' },
      ]
    });

    if (kitsWithoutToken.length === 0) {
      console.log('✅ Tất cả hộp kit đã có qrToken. Không cần migration.');
      process.exit(0);
    }

    console.log(`📦 Tìm thấy ${kitsWithoutToken.length} hộp kit chưa có qrToken. Đang sinh token...`);

    let successCount = 0;
    for (const kit of kitsWithoutToken) {
      const token = crypto.randomUUID();
      kit.qrToken = token;
      await kit.save();
      console.log(`  ✅ [${kit.name}] → qrToken: ${token}`);
      successCount++;
    }

    console.log(`\n🎉 Migration hoàn thành! Đã cập nhật ${successCount}/${kitsWithoutToken.length} hộp kit.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration thất bại:', error.message);
    process.exit(1);
  }
}

migrateQrTokens();
