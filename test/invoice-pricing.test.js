var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');
var tax = require('../lib/tax');

test('Invoice uses the same GST basis and totals as the customer order ledger', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 }];
  var ledgerFigures = pricing.computeTotals(items, 'WELCOME');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'WELCOME' });

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst, sgst: invoiceFigures.sgst, total: invoiceFigures.total },
    { subtotal: ledgerFigures.subtotal, discount: ledgerFigures.discount, tax: ledgerFigures.tax,
      cgst: ledgerFigures.cgst, sgst: ledgerFigures.sgst, total: ledgerFigures.total }
  );
  assert.equal(invoiceFigures.rows[0].gstPercent, ledgerFigures.lines[0].gstPercent);
  assert.equal(invoiceFigures.rows[0].lineTax, ledgerFigures.lines[0].tax);
});

test('Invoice uses the order pricing HSN slab when gstRate is absent', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 }];

  var ledgerFigures = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.equal(tax.getRateForItem(items[0]), 0.05);
  assert.equal(ledgerFigures.tax, 10);
  assert.equal(ledgerFigures.total, 210);
  assert.equal(invoiceFigures.tax, ledgerFigures.tax);
  assert.equal(invoiceFigures.total, ledgerFigures.total);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
});

test('Invoice uses the same coupon discount and post-discount GST as order pricing', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 }];

  var ledgerFigures = pricing.computeTotals(items, 'WELCOME');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'WELCOME' });

  assert.deepEqual(
    { subtotal: ledgerFigures.subtotal, discount: ledgerFigures.discount, tax: ledgerFigures.tax, total: ledgerFigures.total },
    { subtotal: 200, discount: 10, tax: 9.5, total: 199.5 }
  );
  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, total: invoiceFigures.total },
    { subtotal: ledgerFigures.subtotal, discount: ledgerFigures.discount, tax: ledgerFigures.tax, total: ledgerFigures.total }
  );
});

test('Invoice CGST and SGST match the order pricing GST split after rounding', function () {
  var figures = invoice.computeInvoiceFigures({
    items: [{ name: 'Item', price: 0.05, qty: 1, gstRate: 10 }],
    coupon: ''
  });

  assert.equal(figures.tax, 0.01);
  assert.equal(figures.cgst, 0.01);
  assert.equal(figures.sgst, 0);
});

test('Invoice reconciliation banner flags an order total that differs from current pricing', function () {
  var html = invoice.render({
    id: 7,
    total: 999,
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 2 }],
    coupon: ''
  });

  assert.match(html, /Invoice computed total/);
  assert.match(html, /Order Ledger recorded total/);
  assert.match(html, /₹210\.00/);
  assert.match(html, /₹999\.00/);
});
