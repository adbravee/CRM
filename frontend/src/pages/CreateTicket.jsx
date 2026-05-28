import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const initialForm = {
  customer_name: "",
  customer_email: "",
  subject: "",
  description: "",
};

function CreateTicket() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const validateForm = () => {
    if (!form.customer_name.trim()) return "Customer Name is required.";
    if (!form.customer_email.trim()) return "Customer Email is required.";
    if (!/\S+@\S+\.\S+/.test(form.customer_email)) return "Enter a valid email.";
    if (!form.subject.trim()) return "Subject is required.";
    if (!form.description.trim()) return "Description is required.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/api/tickets", form);
      setSuccess(`Ticket created successfully: ${data.ticket_id}`);
      setForm(initialForm);
      setTimeout(() => navigate("/"), 1000);
    } catch (requestError) {
      setError("Could not create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Create New Ticket</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer Name</label>
          <input
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer Email</label>
          <input
            name="customer_email"
            type="email"
            value={form.customer_email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            name="description"
            rows={5}
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? "Creating..." : "Create Ticket"}
        </button>
      </form>
    </section>
  );
}

export default CreateTicket;
