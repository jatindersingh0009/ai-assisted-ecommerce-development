const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDashboardSummary, isAdminRole } = require('../src/services/adminService');

test('buildDashboardSummary aggregates totals for sales, orders, customers, and products', () => {
  const summary = buildDashboardSummary({
    totalSalesCents: 125000,
    totalOrders: 42,
    pendingOrders: 7,
    completedOrders: 25,
    totalCustomers: 320,
    totalProducts: 180,
  });

  assert.equal(summary.totalSales, '1250.00');
  assert.equal(summary.totalOrders, 42);
  assert.equal(summary.pendingOrders, 7);
  assert.equal(summary.completedOrders, 25);
  assert.equal(summary.totalCustomers, 320);
  assert.equal(summary.totalProducts, 180);
});

test('isAdminRole accepts admin and rejects customer roles', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('customer'), false);
});
