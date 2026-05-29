const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Open", "In Progress", "Closed"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ticketColumns =
  "ticket_id, customer_name, customer_email, subject, description, status, created_at, updated_at";

async function generateTicketId() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM tickets");
  const suffix = String(rows[0].count + 1).padStart(4, "0");
  return `TKT-${suffix}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

function parsePagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

router.post("/tickets", async (req, res) => {
  try {
    const { customer_name, customer_email, subject, description } = req.body || {};

    if (!customer_name || !customer_email || !subject || !description) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (!emailRegex.test(customer_email.trim())) {
      return res.status(400).json({ error: "Enter a valid customer email address." });
    }
    if (subject.trim().length > 140) {
      return res.status(400).json({ error: "Subject must be 140 characters or less." });
    }
    if (description.trim().length > 5000) {
      return res.status(400).json({ error: "Description must be 5000 characters or less." });
    }

    const ticketId = await generateTicketId();

    await pool.query(
      `INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status)
       VALUES ($1, $2, $3, $4, $5, 'Open')`,
      [
        ticketId,
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        subject.trim(),
        description.trim(),
      ]
    );

    const { rows } = await pool.query(
      `SELECT ${ticketColumns} FROM tickets WHERE ticket_id = $1`,
      [ticketId]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[POST /tickets]", err);
    return res.status(500).json({ error: "Failed to create ticket." });
  }
});

router.get("/tickets", async (req, res) => {
  try {
    const { status, search } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const filters = [];
    const params = [];
    let paramIndex = 1;

    if (status && status !== "All") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value." });
      }
      filters.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (search) {
      const searchTerm = `%${search.trim()}%`;
      filters.push(`(
        customer_name ILIKE $${paramIndex}
        OR customer_email ILIKE $${paramIndex}
        OR subject ILIKE $${paramIndex}
        OR description ILIKE $${paramIndex}
      )`);
      params.push(searchTerm);
      paramIndex += 1;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM tickets ${whereClause}`,
      params
    );
    const total = countResult.rows[0].count;

    const listParams = [...params, limit, offset];
    const { rows: tickets } = await pool.query(
      `SELECT ${ticketColumns} FROM tickets ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      listParams
    );

    return res.json({
      items: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[GET /tickets]", err);
    return res.status(500).json({ error: "Failed to load tickets." });
  }
});

router.get("/tickets/:ticket_id", async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const { rows } = await pool.query(
      `SELECT ${ticketColumns} FROM tickets WHERE ticket_id = $1`,
      [ticket_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const notesResult = await pool.query(
      `SELECT id, ticket_id, note_text, created_at
       FROM notes WHERE ticket_id = $1
       ORDER BY created_at DESC, id DESC`,
      [ticket_id]
    );

    return res.json({ ...rows[0], notes: notesResult.rows });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[GET /tickets/:id]", err);
    return res.status(500).json({ error: "Failed to load ticket." });
  }
});

router.put("/tickets/:ticket_id", async (req, res) => {
  const client = await pool.connect();
  let beganTransaction = false;
  try {
    const { ticket_id } = req.params;
    const { status, note_text } = req.body || {};

    const existingResult = await client.query(
      `SELECT ${ticketColumns} FROM tickets WHERE ticket_id = $1`,
      [ticket_id]
    );
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found." });
    }
    const existing = existingResult.rows[0];

    if (!status && !note_text) {
      return res
        .status(400)
        .json({ error: "Provide at least one field: status or note_text." });
    }

    const nextStatus = status || existing.status;
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }
    if (note_text && !String(note_text).trim()) {
      return res.status(400).json({ error: "Note cannot be empty." });
    }
    if (note_text && String(note_text).trim().length > 2000) {
      return res.status(400).json({ error: "Note must be 2000 characters or less." });
    }

    await client.query("BEGIN");
    beganTransaction = true;
    await client.query(
      `UPDATE tickets SET status = $1, updated_at = NOW() WHERE ticket_id = $2`,
      [nextStatus, ticket_id]
    );
    if (note_text) {
      await client.query(
        `INSERT INTO notes (ticket_id, note_text) VALUES ($1, $2)`,
        [ticket_id, String(note_text).trim()]
      );
    }
    await client.query("COMMIT");
    beganTransaction = false;

    const { rows } = await client.query(
      `SELECT ${ticketColumns} FROM tickets WHERE ticket_id = $1`,
      [ticket_id]
    );
    const notesResult = await client.query(
      `SELECT id, ticket_id, note_text, created_at
       FROM notes WHERE ticket_id = $1
       ORDER BY created_at DESC, id DESC`,
      [ticket_id]
    );

    return res.json({ ...rows[0], notes: notesResult.rows });
  } catch (err) {
    if (beganTransaction) {
      await client.query("ROLLBACK");
    }
    // eslint-disable-next-line no-console
    console.error("[PUT /tickets/:id]", err);
    return res.status(500).json({ error: "Failed to update ticket." });
  } finally {
    client.release();
  }
});

module.exports = router;
