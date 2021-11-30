const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// LIST
function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function validateOrderComp(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;

  if (!deliverTo) {
    next({ status: 400, message: "Order must include deliverTo" });
  }

  if (!mobileNumber) {
    next({ status: 400, message: "Order must include a mobileNumber" });
  }

  if (!dishes) {
    next({ status: 400, message: "Order must include a dish" });
  }

  if (dishes.length === 0 || !Array.isArray(dishes)) {
    next({ status: 400, message: "Order must include at least one dish" });
  }
  let msgcontent = "";
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      typeof dish.quantity !== "number"
    ) {
      msgcontent = `Dish ${index} must have a quantity that is an integer greater than 0`;
    }
  });
  if (msgcontent) {
    next({
      status: 400,
      message: `${msgcontent}`,
    });
  } else {
    res.locals.create = req.body.data;
    next();
  }
}

function create(req, res) {
  res.locals.create.id = nextId();
  orders.push(res.locals.create);
  res.status(201).json({ data: res.locals.create });
}

function validateOrder(req, res, next) {
  const { orderId } = req.params;
  const orderFound = orders.find((order) => order.id === orderId);

  if (orderFound) {
    res.locals.order = orderFound;
    return next();
  } else {
    next({
      status: 404,
      message: `Order id could not be found: ${orderId}`,
    });
  }
}

function validateUpdate(req, res, next) {
  const { data } = req.body;
  const { orderId } = req.params;
  console.log(data.status);
  if (data.id && data.id !== res.locals.order.id) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}.`,
    });
  } else if (
    !data.status ||
    (data.status !== "pending" &&
      data.status !== "preparing" &&
      data.status !== "out-for-delivery" &&
      data.status !== "delivered")
  ) {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (data.status === "delivered") {
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else {
    data.id = orderId;
    res.locals.update = data;
    next();
  }
}

function update(req, res, next) {
  res.json({ data: res.locals.update });
}

function validateDelete(req, res, next) {
  const { data } = req.body;
  if (res.locals.order.status !== "pending") {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  } else {
    next();
  }
}

function destroy(req, res, next) {
  orders.splice(res.locals.index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [validateOrder, read],
  create: [validateOrderComp, create],
  update: [validateOrder, validateUpdate, validateOrderComp, update],
  delete: [validateOrder, validateDelete, destroy],
};
