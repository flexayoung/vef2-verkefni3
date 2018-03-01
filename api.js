const express = require('express');

const {
  create,
  readAll,
  readOne,
  update,
  del,
} = require('./notes');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function fnReadAll(req, res) {
  await readAll()
    .then(data => res.status(200).json(data));
}

async function fnCreate(req, res) {
  await create(req.body)
    .then(data => res.status(data.status).json(data.data));
}

async function fnReadOne(req, res) {
  await readOne(req.params.id)
    .then(data => res.status(data.status).json(data.data));
}

async function fnUpdate(req, res) {
  await update(req.params.id, req.body)
    .then(data => res.status(data.status).json(data.data));
}

async function fnDelete(req, res) {
  await del(req.params.id)
    .then(data => res.status(data.status).json(data.data));
}

router.route('/')
  .get(catchErrors(fnReadAll))
  .post(catchErrors(fnCreate));

router.route('/:id')
  .get(catchErrors(fnReadOne))
  .put(catchErrors(fnUpdate))
  .delete(catchErrors(fnDelete));

module.exports = router;
