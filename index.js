// index.js
require('dotenv').config(); // For local .env usage
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { ensureDatabaseExists, getDatabasePool } = require('./db');
const { migrate } = require('./migrations');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));  // Serve frontend files

// Ensure the database exists, then run migrations
(async function initializeDB() {
  await ensureDatabaseExists();
  await migrate();
})();

// ======== CRUD Endpoints for Books ========

// Get all books
app.get('/api/books', async (req, res) => {
  const pool = getDatabasePool();
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving books');
  } finally {
    pool.end(); 
  }
});

// Get book by ID
app.get('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const pool = getDatabasePool();
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving the book');
  } finally {
    pool.end();
  }
});

// Create a new book
app.post('/api/books', async (req, res) => {
  const { title, author, description } = req.body;
  const pool = getDatabasePool();
  try {
    const result = await pool.query(
      'INSERT INTO books (title, author, description) VALUES ($1, $2, $3) RETURNING *',
      [title, author, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating book');
  } finally {
    pool.end();
  }
});

// Update an existing book
app.put('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, description } = req.body;
  const pool = getDatabasePool();
  try {
    const result = await pool.query(
      `UPDATE books 
       SET title = $1, author = $2, description = $3
       WHERE id = $4
       RETURNING *`,
      [title, author, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating book');
  } finally {
    pool.end();
  }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const pool = getDatabasePool();
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting book');
  } finally {
    pool.end();
  }
});

// Start server on port 80
const PORT = 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
