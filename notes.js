const validator = require('validator');
const xss = require('xss');
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://:@localhost/meatyminx';


function checkData(title, text, datetime) {
  const errors = [];
  if (typeof title !== 'string' || !validator.isLength(title, { min: 1, max: 255 })) {
    errors.push({ field: 'title', error: 'title must be a non-empty string' });
  } if (typeof text !== 'string') {
    errors.push({ field: 'text', error: 'text must be a string' });
  } if (!validator.isISO8601(datetime)) {
    errors.push({ field: 'datetime', error: 'Datetime must be a ISO 8601 date' });
  }
  return errors;
}

/**
 * Create a note asynchronously.
 *
 * @param {Object} note - Note to create
 * @param {string} note.title - Title of note
 * @param {string} note.text - Text of note
 * @param {string} note.datetime - Datetime of note
 *
 * @returns {Promise} Promise representing the object result of creating the note
 */
async function create({ title, text, datetime } = {}) {
  const client = new Client({ connectionString });
  client.connect();
  let res;
  res = checkData(title, text, datetime);
  if (res.length !== 0) {
    return { status: 400, data: res };
  }
  try {
    const query = 'INSERT INTO notes(datetime, title, text) VALUES($1, $2, $3) RETURNING *';
    res = await client.query(query, [datetime, title, text].map(i => xss(i)));
    if (res.rowCount === 0) return { status: 500, data: 'Internal error' };
    return { status: 201, data: res.rows };
  } catch (err) {
    console.error('Error on inserting into data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Read all notes.
 *
 * @returns {Promise} Promise representing an array of all note objects
 */
async function readAll() {
  const client = new Client({ connectionString });
  client.connect();
  let res;
  try {
    res = await client.query('SELECT * FROM notes');
    return res.rows;
  } catch (err) {
    console.error('Error reading data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Read a single note.
 *
 * @param {number} id - Id of note
 *
 * @returns {Promise} Promise representing the note object or null if not found
 */
async function readOne(id) {
  const client = new Client({ connectionString });

  client.connect();

  let res;
  try {
    res = await client.query('SELECT * FROM notes WHERE $1=id', [id]);
    if (res.rowCount === 0) return { status: 404, data: { error: 'Note not found' } };
    return { status: 200, data: res.rows };
  } catch (err) {
    console.error('Error reading from data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Update a note asynchronously.
 *
 * @param {number} id - Id of note to update
 * @param {Object} note - Note to create
 * @param {string} note.title - Title of note
 * @param {string} note.text - Text of note
 * @param {string} note.datetime - Datetime of note
 *
 * @returns {Promise} Promise representing the object result of creating the note
 */
async function update(id, { title, text, datetime } = {}) {
  const client = new Client({ connectionString });
  client.connect();

  let res;
  const query = 'UPDATE notes SET title = $2, text = $3, datetime = $4 WHERE id = $1 RETURNING *';
  res = await checkData(title, text, datetime);

  if (res.length !== 0) {
    return { status: 400, errors: res.errors };
  }
  try {
    res = await client.query(query, [id, title, text, datetime].map(i => xss(i)));
    if (res.rowCount === 0) return { status: 404, data: { error: 'Note not found' } };
    return { status: 200, data: res.rows };
  } catch (err) {
    console.error('Error updating data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Delete a note asynchronously.
 *
 * @param {number} id - Id of note to delete
 *
 * @returns {Promise} Promise representing the boolean result of creating the note
 */
async function del(id) {
  const client = new Client({ connectionString });

  client.connect();

  let res;
  try {
    const query = 'DELETE FROM notes WHERE id = $1 RETURNING *';
    res = await client.query(query, [id]);
    if (res.rowsCount === 0) return { status: 404, data: { error: 'Note not found' } };
    return { status: 204, data: res.rows };
  } catch (err) {
    console.error('Error deleting data');
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = {
  create,
  readAll,
  readOne,
  update,
  del,
};
