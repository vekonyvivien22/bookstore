module.exports = function Cart(oldCart) {
  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;

  this.add = function (item, id) {
    var storedItem = this.items[id];
    if (!storedItem) {
      storedItem = this.items[id] = { item, qty: 0, price: 0 };
    }
    storedItem.qty++;
    storedItem.price = storedItem.item.price * storedItem.qty;
    this.totalQty++;
    this.totalPrice += storedItem.item.price;
  };

  this.sub = function (item, id) {
    var storedItem = this.items[id];
    if (storedItem) {
      storedItem.qty--;
      if (storedItem.qty == 0) {
        delete this.items[id];
      } else {
        storedItem.price = storedItem.item.price * storedItem.qty;
      }

      if (this.totalQty == 0) {
        this.totalQty = 0;
        this.totalPrice = 0;
      } else {
        this.totalQty--;
        this.totalPrice -= storedItem.item.price;
      }
    }
  };

  this.generateArray = function () {
    var arr = [];
    for (var id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  };
};
