var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('selling the last sellable unit is allowed', function () {
  var products = [{ id: 1, name: 'Tea', stock: 1, reserved: 0 }];

  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
  assert.equal(products[0].stock, 1);
});

test('cancelling a sold order restores its physical stock', function () {
  var product = { id: 1, name: 'Tea', stock: 1, reserved: 0 };
  var db = {
    products: [product],
    orders: [],
    nextOrderId: 1
  };
  var items = [{ id: 1, name: 'Tea', qty: 1 }];

  inventory.reserve(db.products, items);
  var order = orders.add(db, { items: items, total: 10 });
  assert.equal(product.stock, 0);

  var result = orders.cancel(db, order.id, 'Customer changed their mind');

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.equal(product.stock, 1);
  assert.equal(product.reserved, 0);
  assert.equal(inventory.getSellableStock(product), 1);
});
