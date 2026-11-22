var test = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

test('order history shows newest orders first across DD/MM/YYYY dates', function () {
  var db = {
    orders: [
      { id: 1008, date: '15/03/2022' },
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' }
    ]
  };

  assert.deepEqual(orders.list(db).map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('order history date range includes only dates within the selected range', function () {
  var db = {
    orders: [
      { id: 1008, date: '15/03/2022' },
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' }
    ]
  };

  assert.deepEqual(
    orders.list(db, { from: '2022-03-01', to: '2022-03-31' }).map(function (order) { return order.id; }),
    [1008]
  );
});

test('settlement amount is added numerically to customer totalSettled', function () {
  var db = {
    customers: [{
      id: 7,
      name: 'Meera Joshi',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200
    }],
    nextSettlementId: 1,
    settlements: []
  };

  var result = ledger.recordSettlement(db, 7, '500', 'upi', 'Part payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});
