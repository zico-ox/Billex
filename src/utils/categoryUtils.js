/**
 * Category utility helpers for Billex POS
 */

export const getCategoryClass = (category) => {
  if (!category) return 'cat-badge-default';
  const clean = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `cat-badge-${clean}`;
};
