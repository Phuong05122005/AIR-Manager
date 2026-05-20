/**
 * Mã linh kiện: viết tắt tên + số thứ tự (vd. Main → M1, Servo → S1, Servo thứ 2 → S2)
 */

function getFirstChar(word) {
  const clean = String(word || '').replace(/[^a-zA-ZÀ-ỹ0-9]/gi, '');
  if (!clean) return '';
  return clean.charAt(0).toUpperCase();
}

function getNameAbbreviation(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'LK';

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return getFirstChar(words[0]) || 'L';
  }

  const abbr = words.map(getFirstChar).join('');
  return abbr.slice(0, 4) || 'LK';
}

function getComponentQuantity(comp) {
  if (comp.quantity != null && Number(comp.quantity) > 0) {
    return Number(comp.quantity);
  }
  if (comp.code && /^\d+$/.test(String(comp.code).trim())) {
    return parseInt(comp.code, 10);
  }
  return 1;
}

/** Gán mã cho toàn bộ linh kiện trong một hộp kit (theo thứ tự danh sách) */
function assignCodesToComponents(components) {
  const prefixCounts = {};

  return (components || []).map((comp) => {
    const abbr = getNameAbbreviation(comp.name);
    prefixCounts[abbr] = (prefixCounts[abbr] || 0) + 1;
    const code = `${abbr}${prefixCounts[abbr]}`;

    return {
      ...comp,
      code,
      quantity: getComponentQuantity(comp),
    };
  });
}

/** Sinh mã cho linh kiện mới / đổi tên (không trùng trong cùng hộp kit) */
function generateComponentCode(name, existingComponents, excludeId = null) {
  const abbr = getNameAbbreviation(name);
  const others = (existingComponents || []).filter((c) => c.id !== excludeId);
  let maxNum = 0;

  others.forEach((c) => {
    const code = c.code;
    if (!code || code === 'N/A') return;
    const match = String(code).match(new RegExp(`^${abbr}(\\d+)$`, 'i'));
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  });

  return `${abbr}${maxNum + 1}`;
}

function hasValidComponentCode(code) {
  return code && code !== 'N/A' && /^[A-ZÀ-ỹ][A-ZÀ-ỹ0-9]*\d+$/i.test(String(code).trim());
}

function resolveComponentCode(comp, components) {
  if (hasValidComponentCode(comp.code)) {
    return String(comp.code).toUpperCase();
  }
  return generateComponentCode(comp.name, components, comp.id);
}

module.exports = {
  getNameAbbreviation,
  getComponentQuantity,
  assignCodesToComponents,
  generateComponentCode,
  resolveComponentCode,
  hasValidComponentCode,
};
