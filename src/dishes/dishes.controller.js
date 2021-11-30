const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

function localData(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  let newDish = {
    name,
    description,
    price,
    image_url,
    id: nextId(),
  };
  res.locals.dish = newDish;
  next();
}

function validateDish(req, res, next) {
  const { dishId } = req.params;
  const findDish = dishes.find((dish) => dish.id == dishId);

  res.locals.dish = findDish;
  findDish
    ? next()
    : next({
        status: 404,
        message: `Dish id does not exist: ${dishId}.`,
      });
}

function validateUpdate(req, res, next) {
  const { dishId } = req.params;
  const { data } = req.body;
  const findDish = dishes.find((dish) => dish.id == dishId);
  const index = dishes.findIndex((dish) => dish.id == dishId);

  if (findDish) {
    data.id = dishId;
    res.locals.dish = data;
    dishes[index] = data;
    next();
  }
}

function validateInfo(req, res, next) {
  const {
    data: { id, name, description, price, image_url },
  } = req.body;
  if (!name) {
    next({
      status: 400,
      message: "Dish must include a name",
    });
  }

  if (!description) {
    next({
      status: 400,
      message: "Dish must include a description",
    });
  }

  if (!price) {
    next({
      status: 400,
      message: "Dish must include a price",
    });
  } else if (price <= 0 || typeof price != "number") {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  if (!image_url) {
    next({
      status: 400,
      message: "Dish must include an image_url",
    });
  }

  if (id && id !== res.locals.dish.id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`,
    });
  }
  next();
}

function create(req, res, next) {
  dishes.push(res.locals.dish);
  res.status(201).json({ data: res.locals.dish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  res.status(200).json({ data: res.locals.dish });
}

module.exports = {
  list,
  read: [validateDish, read],
  create: [localData, validateInfo, create],
  update: [validateDish, validateInfo, validateUpdate, update],
};
