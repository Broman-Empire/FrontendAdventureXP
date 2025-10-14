// ---- Admin Dashboard ----

import { navigation } from "../main.js";
import {
    listAdminReservations,
    searchReservationByPhone,
    deleteReservation
} from "../api.js";

const state = {
    reservations: [],
    filters: { phone: "", date: "" }
};

let refs = {};

export function mount(container) {
    container.innerHTML = getMarkup();

    refs = {
        closeBtn: container.querySelector("[data-action='close']"),
        nav: container.querySelector("[data-role='admin-nav']"),
        form: container.querySelector("[data-role='filters']"),
        phone: container.querySelector("[data-input='phone']"),
        date: container.querySelector("[data-input='date']"),
        clearBtn: container.querySelector("[data-action='clear']"),
        status: container.querySelector("[data-role='status']"),
        list: container.querySelector("[data-role='reservations']")
    };

    bindClose();
    bindNavigation();
    bindFilters();

    loadReservations();
}

function getMarkup() {
    return `
    <section class="admin view-shell">
      <header class="view-shell__header">
        <div class="view-shell__title-group">
          <h1 class="view-shell__title">Admin Dashboard</h1>
          <p class="view-shell__subtitle">Manage reservations and filter by day or phone number.</p>
        </div>
        <div class="view-shell__actions">
          <button type="button" class="booking-close" data-action="close">×</button>
          <nav class="view-shell__nav" data-role="admin-nav">
            <button class="btn btn--ghost" data-target="activities">Activities</button>
            <button class="btn btn--ghost" data-target="equipment">Equipment</button>
          </nav>
        </div>
      </header>

      <section class="view-shell__layout">
        <section class="panel">
          <header class="panel__header">
            <h2 class="panel__title">Reservations</h2>
            <p class="panel__subtitle">Search by phone number or date.</p>
          </header>

          <form class="form-grid" data-role="filters">
            <label class="form-field">
              <span class="form-label">Phone number</span>
              <input data-input="phone" type="text" placeholder="e.g. 12345678" autocomplete="tel" />
            </label>
            <label class="form-field">
              <span class="form-label">Date</span>
              <input data-input="date" type="date" />
            </label>
            <div class="form-actions">
              <button type="submit" class="btn btn--primary">Load</button>
              <button type="button" class="btn btn--ghost" data-action="clear">Reset</button>
            </div>
          </form>

          <p class="panel__status" data-role="status"></p>
          <div class="panel__body" data-role="reservations">
            <p class="panel__empty">Loading…</p>
          </div>
        </section>
      </section>
    </section>
    `;
}

// Bindings
function bindClose() {
    refs.closeBtn?.addEventListener("click", () => navigation("frontpage"));
}

function bindNavigation() {
    refs.nav?.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-target]");
        if (!btn) return;
        navigation(btn.dataset.target);
    });
}

function bindFilters() {
    if (!refs.form) return;

    refs.form.addEventListener("submit", (event) => {
        event.preventDefault();
        state.filters.phone = (refs.phone?.value || "").trim();
        state.filters.date = refs.date?.value || "";
        loadReservations();
    });

    refs.clearBtn?.addEventListener("click", () => {
        if (refs.phone) refs.phone.value = "";
        if (refs.date) refs.date.value = "";
        state.filters = { phone: "", date: "" };
        loadReservations();
        updateStatus("Filters reset.");
    });
}

// Load and render reservations
async function loadReservations() {
    renderLoading(refs.list, "Loading reservations…");
    try {
        const { phone, date } = state.filters;
        const data = phone
            ? await searchReservationByPhone(phone)
            : await listAdminReservations(date ? { date } : undefined);

        state.reservations = Array.isArray(data) ? data : [];
        renderReservationTable();

        const label = phone ? `phone ${formatPhone(phone)}` : date ? `date ${formatDate(date)}` : "all";
        updateStatus(`Showing ${state.reservations.length} reservations (${label}).`);
    } catch (error) {
        console.error(error);
        renderError(refs.list, error);
        updateStatus(error?.message || "Failed to load reservations.", true);
    }
}

function renderReservationTable() {
    if (!refs.list) return;
    if (!state.reservations.length) {
        refs.list.innerHTML = `<p class="panel__empty">No results. Try adjusting the filters.</p>`;
        return;
    }

    const rows = state.reservations.map((reservation) => {
        const bookings = (reservation.bookings || [])
            .map((item) => `<li>${escapeHtml(item.activityName || "-")}<br><span>${escapeHtml(item.timeSlot || "-")}</span></li>`) // Map each booking to a list item
            .join("");

            //table setup: ID, Contact, Email, Phone, Type, Created, Bookings, [Delete button]
        return `
        <tr data-reservation-id="${reservation.id}">
          <td>${reservation.id}</td>
          <td>${escapeHtml(reservation.contactName || "-")}</td>
          <td>${escapeHtml(reservation.email || "-")}</td>
          <td>${formatPhone(reservation.phone)}</td>
          <td>${escapeHtml(reservation.customerType || "-")}</td>
          <td>${formatDateTime(reservation.createdAt)}</td>
          <td><ul class="panel__list">${bookings || "<li>No bookings</li>"}</ul></td>
          <td class="panel__actions">
            <button type="button" class="btn btn--primary" data-action="delete">Delete</button>
          </td>
        </tr>`;
    }).join("");

    refs.list.innerHTML = `
      <table class="table panel__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Type</th>
            <th>Created</th>
            <th>Bookings</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    refs.list.querySelectorAll("[data-action='delete']").forEach((btn) => {
        btn.addEventListener("click", () => {
            const row = btn.closest("tr[data-reservation-id]");
            if (!row) return;
            handleDelete(row.dataset.reservationId);
        });
    });
}

async function handleDelete(reservationId) {
    if (!reservationId) return;
    if (!window.confirm(`Delete reservation #${reservationId}?`)) return;

    try {
        await deleteReservation(reservationId);
        updateStatus(`Reservation #${reservationId} has been deleted.`);
        await loadReservations();
    } catch (error) {
        console.error(error);
        updateStatus(error?.message || "Failed to delete reservation.", true);
    }
}

function renderLoading(container, message) {
    if (!container) return;
    container.innerHTML = `<p class="panel__empty">${message}</p>`;
}

function renderError(container, error) {
    if (!container) return;
    container.innerHTML = `<p class="panel__empty">${error?.message || "Something went wrong."}</p>`;
}

function updateStatus(message, isError = false) {
    if (!refs.status) return;
    refs.status.textContent = message;
    refs.status.dataset.tone = isError ? "error" : "info";
}

function formatPhone(value) {
    if (!value) return "-";
    const digits = String(value).replace(/\D/g, "");
    return digits.length === 8 ? digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : value;
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("da-DK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("da-DK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(input) {
    if (input === null || input === undefined) return "";
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function todayISO() {
    return new Date().toISOString().split("T")[0];
}
