'use strict';

const URINE_OPTIONS = ['Yes', 'No'];

const toNumber = v =>
  typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);

/**
 * Whitelist + validate the editable clinical fields.
 * Returns { errors: string[], values: { column: value } } where the keys of
 * `values` are fixed column names (never taken from the request).
 */
function validateClientEdit(body) {
  const errors = [];
  const values = {};
  const src = body && typeof body === 'object' ? body : {};
  const has = k => Object.prototype.hasOwnProperty.call(src, k);

  if (has('systolic') || has('diastolic')) {
    const sRaw = src.systolic;
    const dRaw = src.diastolic;
    const clearing = (sRaw === null || sRaw === '') && (dRaw === null || dRaw === '');

    if (clearing) {
      values.systolic = null;
      values.diastolic = null;
    } else {
      const s = toNumber(sRaw);
      const d = toNumber(dRaw);
      if (!Number.isInteger(s) || s < 50 || s > 300)
        errors.push('Systolic pressure must be a whole number between 50 and 300.');
      if (!Number.isInteger(d) || d < 30 || d > 200)
        errors.push('Diastolic pressure must be a whole number between 30 and 200.');
      if (!errors.length && s <= d)
        errors.push('Systolic pressure must be higher than diastolic pressure.');
      if (!errors.length) {
        values.systolic = s;
        values.diastolic = d;
      }
    }
  }

  if (has('sugar')) {
    if (src.sugar === null || src.sugar === '') {
      values.sugar = null;
    } else {
      const g = toNumber(src.sugar);
      if (!Number.isFinite(g) || g <= 0 || g > 1500)
        errors.push('Blood sugar must be a number greater than 0 and at most 1500.');
      else
        values.sugar = Math.round(g * 100) / 100;
    }
  }

  if (has('urineSugar')) {
    if (!URINE_OPTIONS.includes(src.urineSugar))
      errors.push('Urine sugar must be "Yes" or "No".');
    else
      values.urine_sugar = src.urineSugar;
  }

  if (!errors.length && Object.keys(values).length === 0)
    errors.push('No editable fields were supplied.');

  return { errors, values };
}

module.exports = { validateClientEdit, URINE_OPTIONS };