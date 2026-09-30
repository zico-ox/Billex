/**
 * ESC/POS Thermal Receipt Generator for Weknd. Juice & Rolls
 * Formatted for EXEO EX58P 58mm Thermal Printer (384 dots print width / 32 characters per line)
 */

export const ESC = 0x1B;
export const GS = 0x1D;

export const COMMANDS = {
  INIT: [ESC, 0x40],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_SIZE: [GS, 0x21, 0x11],
  DOUBLE_HEIGHT: [GS, 0x21, 0x01],
  DOUBLE_WIDTH: [GS, 0x21, 0x10],
  NORMAL_SIZE: [GS, 0x21, 0x00],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  LINE_SPACING_DEFAULT: [ESC, 0x32],
  FEED_LINE: [0x0A],
  CUT_PARTIAL: [GS, 0x56, 0x01],
};

const LINE_WIDTH = 32;

export function cleanAscii(str = '') {
  return String(str)
    .replace(/₹/g, 'Rs.')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
}

export function padCenter(text, width = LINE_WIDTH) {
  const clean = cleanAscii(text);
  if (clean.length >= width) return clean.slice(0, width);
  const left = Math.floor((width - clean.length) / 2);
  const right = width - clean.length - left;
  return ' '.repeat(left) + clean + ' '.repeat(right);
}

export function padLeft(text, width) {
  const clean = cleanAscii(text);
  if (clean.length >= width) return clean.slice(0, width);
  return ' '.repeat(width - clean.length) + clean;
}

export function padRight(text, width) {
  const clean = cleanAscii(text);
  if (clean.length >= width) return clean.slice(0, width);
  return clean + ' '.repeat(width - clean.length);
}

export function twoColumn(left, right, width = LINE_WIDTH) {
  const cleanLeft = cleanAscii(left);
  const cleanRight = cleanAscii(right);
  const spaces = width - cleanLeft.length - cleanRight.length;
  if (spaces >= 1) return cleanLeft + ' '.repeat(spaces) + cleanRight;
  const avail = Math.max(3, width - cleanRight.length - 1);
  return cleanLeft.slice(0, avail) + ' ' + cleanRight;
}

export function threeColumn(col1, col2, col3, w1 = 15, w2 = 6, w3 = 11) {
  const c1 = padRight(cleanAscii(col1), w1);
  const c2 = padLeft(cleanAscii(col2), w2);
  const c3 = padLeft(cleanAscii(col3), w3);
  return c1 + c2 + c3;
}

export function cleanBillNo(str = '') {
  const match = String(str).match(/(\d+)/);
  if (match) return match[1].padStart(6, '0');
  return '000125';
}

export function formatReceiptDateTime(sale) {
  let d = new Date();
  if (sale.timestamp) {
    d = new Date(sale.timestamp);
  } else if (sale.date) {
    const parsed = Date.parse(sale.date);
    if (!isNaN(parsed)) d = new Date(parsed);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const dateStr = `${day}/${month}/${year}`;

  const timeStr = sale.time || d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return `${dateStr} ${timeStr}`;
}

export function formatReceiptText(sale, settings = {}) {
  const shopName = settings.shopName || 'WEKND.';
  const subTitle = settings.subTitle || 'Juice & Rolls';
  const divider = '-'.repeat(LINE_WIDTH);

  const lines = [];

  // Header (Centered, bold and bigger)
  lines.push(padCenter(shopName.toUpperCase()));
  if (subTitle) lines.push(padCenter(subTitle));
  lines.push('');

  // Bill No and Date/Time
  const billLine = `Bill: ${cleanBillNo(sale.billNo)} | ${formatReceiptDateTime(sale)}`;
  lines.push(cleanAscii(billLine));

  // Table Header
  lines.push(divider);
  lines.push('Product           Qty     Amount');
  lines.push(divider);

  // Items
  const items = sale.items || [];
  items.forEach(item => {
    const name = item.name || 'Item';
    const qty = String(item.qty || 1);
    const amount = `Rs.${Number(item.amount || (item.sellingPrice * item.qty)).toFixed(0)}`;

    if (name.length <= 16) {
      lines.push(threeColumn(name, qty, amount, 16, 5, 11));
    } else {
      lines.push(name.slice(0, LINE_WIDTH));
      lines.push(threeColumn('  ', qty, amount, 16, 5, 11));
    }
  });

  lines.push(divider);

  // Parcel Fee (if present)
  if (sale.parcelFee && Number(sale.parcelFee) > 0) {
    const pCount = sale.parcelCount || Math.round(Number(sale.parcelFee) / 5);
    lines.push(twoColumn(`Parcel Fee (${pCount})`, `Rs.${Number(sale.parcelFee).toFixed(0)}`));
  }

  // TOTAL (Bigger & bold)
  lines.push(twoColumn('TOTAL', `Rs.${Number(sale.total).toFixed(0)}`));
  lines.push(divider);

  // Footer
  lines.push('');
  lines.push(padCenter('THANK YOU!'));
  lines.push(padCenter('VISIT WEKND. AGAIN'));

  return lines;
}

export function generateReceiptEscPosBytes(sale, settings = {}) {
  const shopName = settings.shopName || 'WEKND.';
  const subTitle = settings.subTitle || 'Juice & Rolls';
  const feedLines = settings.feedLines || 4;
  const divider = '-'.repeat(LINE_WIDTH);

  const bytes = [];
  const append = (arr) => { for (let i = 0; i < arr.length; i++) bytes.push(arr[i]); };
  const appendText = (text) => {
    const clean = cleanAscii(text);
    for (let i = 0; i < clean.length; i++) bytes.push(clean.charCodeAt(i));
  };
  const appendLine = (text) => {
    appendText(text);
    bytes.push(0x0A);
  };

  append(COMMANDS.INIT);
  append(COMMANDS.LINE_SPACING_DEFAULT);

  // Header (Both in center, bold & bigger)
  append(COMMANDS.ALIGN_CENTER);
  append(COMMANDS.BOLD_ON);
  append(COMMANDS.DOUBLE_SIZE);
  appendLine(shopName.toUpperCase());
  append(COMMANDS.NORMAL_SIZE);
  append(COMMANDS.DOUBLE_HEIGHT);
  if (subTitle) appendLine(subTitle);
  append(COMMANDS.NORMAL_SIZE);
  append(COMMANDS.BOLD_OFF);
  appendLine('');

  // Bill Line
  append(COMMANDS.ALIGN_LEFT);
  appendLine(`Bill: ${cleanBillNo(sale.billNo)} | ${formatReceiptDateTime(sale)}`);

  // Table Header
  appendLine(divider);
  append(COMMANDS.BOLD_ON);
  appendLine('Product           Qty     Amount');
  append(COMMANDS.BOLD_OFF);
  appendLine(divider);

  // Items
  (sale.items || []).forEach(item => {
    const name = item.name || 'Item';
    const qty = String(item.qty || 1);
    const amount = `Rs.${Number(item.amount || (item.sellingPrice * item.qty)).toFixed(0)}`;

    if (name.length <= 16) {
      appendLine(threeColumn(name, qty, amount, 16, 5, 11));
    } else {
      appendLine(name.slice(0, LINE_WIDTH));
      appendLine(threeColumn('  ', qty, amount, 16, 5, 11));
    }
  });

  // Divider
  appendLine(divider);

  // Parcel Fee (if present)
  if (sale.parcelFee && Number(sale.parcelFee) > 0) {
    const pCount = sale.parcelCount || Math.round(Number(sale.parcelFee) / 5);
    appendLine(twoColumn(`Parcel Fee (${pCount})`, `Rs.${Number(sale.parcelFee).toFixed(0)}`));
  }

  // TOTAL (Bigger & Bold)
  append(COMMANDS.BOLD_ON);
  append(COMMANDS.DOUBLE_HEIGHT);
  appendLine(twoColumn('TOTAL', `Rs.${Number(sale.total).toFixed(0)}`));
  append(COMMANDS.NORMAL_SIZE);
  append(COMMANDS.BOLD_OFF);
  appendLine(divider);

  // Footer (Centered & Bold)
  appendLine('');
  append(COMMANDS.ALIGN_CENTER);
  append(COMMANDS.BOLD_ON);
  appendLine('THANK YOU!');
  appendLine('VISIT WEKND. AGAIN');
  append(COMMANDS.BOLD_OFF);

  // Feed & Cut
  append([ESC, 0x64, Math.max(3, feedLines)]);
  append(COMMANDS.CUT_PARTIAL);

  return new Uint8Array(bytes);
}
