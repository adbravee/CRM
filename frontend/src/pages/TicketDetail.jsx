import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";

const statuses = ["Open", "In Progress", "Closed"];

function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("Open");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTicket() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/api/tickets/${id}`);
        setTicket(data);
        setStatus(data.status);
      } catch (requestError) {
        setError("Failed to load ticket details.");
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [id]);

  const updateTicket = async ({ nextStatus, noteText = "" }) => {
    setSaving(true);
    setError("");
    try {
      const payload = { status: nextStatus };
      if (noteText.trim()) payload.note_text = noteText.trim();
      const { data } = await api.put(`/api/tickets/${id}`, payload);
      setTicket(data);
      setStatus(data.status);
      setNote("");
    } catch (requestError) {
      setError("Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !ticket) {
    return (
      <section className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Ticket {ticket.ticket_id}</h1>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-700">Customer:</span> {ticket.customer_name}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Email:</span> {ticket.customer_email}
          </p>
          <p className="sm:col-span-2">
            <span className="font-semibold text-slate-700">Subject:</span> {ticket.subject}
          </p>
          <p className="sm:col-span-2">
            <span className="font-semibold text-slate-700">Description:</span> {ticket.description}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Update Status / Add Note</h2>
        <div className="space-y-3">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            {statuses.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {statusValue}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a note (optional)"
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => updateTicket({ nextStatus: status, noteText: note })}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Notes</h2>
        {ticket.notes.length === 0 ? (
          <p className="text-slate-600">No notes yet for this ticket.</p>
        ) : (
          <ul className="space-y-3">
            {ticket.notes.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-sm text-slate-800">{item.note_text}</p>
                <p className="text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default TicketDetail;
