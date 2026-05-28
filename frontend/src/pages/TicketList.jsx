import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";

const statusFilters = ["All", "Open", "In Progress", "Closed"];

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [status, debouncedSearch]);

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (status !== "All") params.status = status;
        if (debouncedSearch) params.search = debouncedSearch;
        params.page = pagination.page;
        params.limit = 25;
        const { data } = await api.get("/api/tickets", { params });
        setTickets(data.items || []);
        setPagination((prev) => ({
          ...prev,
          totalPages: data.pagination?.totalPages || 1,
        }));
      } catch (fetchError) {
        setError("Failed to load tickets. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [status, debouncedSearch, pagination.page]);

  const hasTickets = useMemo(() => tickets.length > 0, [tickets]);

  return (
    <section className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <Link
          to="/create"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Create Ticket
        </Link>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <input
          type="text"
          placeholder="Search by customer, email, subject, or description..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {statusFilters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                status === value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : !hasTickets ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
          No tickets found. Create your first ticket to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Ticket ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Created Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.ticket_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                    <Link to={`/tickets/${ticket.ticket_id}`}>{ticket.ticket_id}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{ticket.customer_name}</td>
                  <td className="px-4 py-3 text-sm">{ticket.subject}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(ticket.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPagination((p) => ({ ...p, page: Math.max(p.page - 1, 1) }))}
          disabled={pagination.page <= 1}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-slate-600">
          Page {pagination.page} / {pagination.totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            setPagination((p) => ({ ...p, page: Math.min(p.page + 1, p.totalPages) }))
          }
          disabled={pagination.page >= pagination.totalPages}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default TicketList;
