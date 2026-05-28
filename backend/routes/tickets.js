const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();
const allowedStatuses = ["Open", "In Progress", "Closed"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ticketCountStmt = db.prepare("SELECT COUNT(*) AS count FROM tickets");
const insertTicketStmt = db.prepare(`
  INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status, created_at, updated_at)
  VALUES (@ticket_id, @customer_name, @customer_email, @subject, @description, @status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);
const listTicketsBaseQuery = `
  SELECT ticket_id, customer_name, customer_email, subject, description, status, created_at, updated_at
  FROM tickets
`;
const getTicketStmt = db.prepare(`
  SELECT ticket_id, customer_name, customer_email, subject, description, status, created_at, updated_at
  FROM tickets
  WHERE ticket_id = ?
`);
const getNotesStmt = db.prepare(`
  SELECT id, ticket_id, note_text, created_at
  FROM notes
  WHERE ticket_id = ?
  ORDER BY created_at DESC, id DESC
`);
const updateTicketStmt = db.prepare(`
  UPDATE tickets
  SET status = @status, updated_at = CURRENT_TIMESTAMP
  WHERE ticket_id = @ticket_id
`);
const insertNoteStmt = db.prepare(`
  INSERT INTO notes (ticket_id, note_text, created_at)
  VALUES (@ticket_id, @note_text, CURRENT_TIMESTAMP)
`);

function generateTicketId() {
  const { count } = ticketCountStmt.get();
  const suffix = String(count + 1).padStart(4, "0");
  return `TKT-${suffix}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

function parsePagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

router.post("/tickets", (req, res) => {
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

  const ticketId = generateTicketId();

  insertTicketStmt.run({
    ticket_id: ticketId,
    customer_name: customer_name.trim(),
    customer_email: customer_email.trim().toLowerCase(),
    subject: subject.trim(),
    description: description.trim(),
    status: "Open",
  });

  const createdTicket = getTicketStmt.get(ticketId);
  return res.status(201).json(createdTicket);
});

router.get("/tickets", (req, res) => {
  const { status, search } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  const filters = [];
  const params = [];

  if (status && status !== "All") {
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }
    filters.push("status = ?");
    params.push(status);
  }

  if (search) {
    const searchTerm = `%${search.trim()}%`;
    filters.push(`
      (
        customer_name LIKE ?
        OR customer_email LIKE ?
        OR subject LIKE ?
        OR description LIKE ?
      )
    `);
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) AS count FROM tickets ${whereClause}`;
  const total = db.prepare(countQuery).get(...params).count;
  const query = `${listTicketsBaseQuery} ${whereClause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
  const tickets = db.prepare(query).all(...params, limit, offset);

  return res.json({
    items: tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

router.get("/tickets/:ticket_id", (req, res) => {
  const { ticket_id } = req.params;
  const ticket = getTicketStmt.get(ticket_id);

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  const notes = getNotesStmt.all(ticket_id);
  return res.json({ ...ticket, notes });
});

router.put("/tickets/:ticket_id", (req, res) => {
  const { ticket_id } = req.params;
  const { status, note_text } = req.body || {};

  const existing = getTicketStmt.get(ticket_id);
  if (!existing) {
    return res.status(404).json({ error: "Ticket not found." });
  }

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

  const updateTransaction = db.transaction(() => {
    updateTicketStmt.run({ status: nextStatus, ticket_id });

    if (note_text) {
      insertNoteStmt.run({
        ticket_id,
        note_text: String(note_text).trim(),
      });
    }
  });

  updateTransaction();

  const updated = getTicketStmt.get(ticket_id);
  const notes = getNotesStmt.all(ticket_id);
  return res.json({ ...updated, notes });
});

module.exports = router;
