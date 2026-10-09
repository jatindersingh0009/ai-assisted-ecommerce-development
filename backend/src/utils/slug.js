const slugify = (value = '') => {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
};

const centsToDollars = (cents = 0) => {
  return (Number(cents || 0) / 100).toFixed(2);
};

module.exports = {
  slugify,
  centsToDollars,
};
