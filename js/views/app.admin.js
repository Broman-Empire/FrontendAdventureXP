// ---- Admin Dashboard ----

import { navigation } from "../main.js";
import {
    listAdminReservations,
    searchReservationByPhone,
    getDailySchedule,
    deleteReservation
} from "../api.js";

const state = {
    reservations: [],
    schedule: [],
    filters: { phone: "", date: "" }
};

let refs = {};

export function mount(container) {
    container.innerHTML = getMarkup();

    refs = {
        nav: container.querySelector("[data-role='admin-nav']"),
        form: container.querySelector("[data-role='filters']"),
        phone: container.querySelector("[data-input='phone']"),
        date: container.querySelector("[data-input='date']"),
        clearBtn: container.querySelector("[data-action='clear']"),
        status: container.querySelector("[data-role='status']"),
        list: container.querySelector("[data-role='reservations']"),
        scheduleDate: container.querySelector("[data-input='schedule-date']"),
        schedule: container.querySelector("[data-role='schedule']")
    };

    bindNavigation();
    bindFilters();
    bindSchedule();

    loadReservations();
    loadSchedule();
}

function getMarkup() {
    return `
    <section class="admin-dashboard container">
      <header class="admin-dashboard__header">
        <div>
          <h1 class="admin-dashboard__title">Admin Dashboard</h1>
          <p class="admin-dashboard__subtitle">Manage reservations and view the daily schedule.</p>
        </div>
        <nav class="admin-dashboard__nav" data-role="admin-nav">
          <button class="btn btn--ghost" data-target="frontpage">Forside</button>
          <button class="btn btn--ghost" data-target="activities">Aktiviteter</button>
          <button class="btn btn--ghost" data-target="equipment">Udstyr</button>
        </nav>
      </header>

      <div class="admin-dashboard__layout">
        <section class="admin-card">
          <header class="admin-card__header">
            <h2 class="admin-card__title">Reservations</h2>
            <p class="admin-card__subtitle">Search by phone number or date.</p>
          </header>

          <form class="admin-filters" data-role="filters">
            <div class="admin-field">
              <label for="admin-phone">Phone number</label>
              <input id="admin-phone" data-input="phone" type="text" placeholder="e.g. 12345678" autocomplete="tel"/>
            </div>
            <div class="admin-field">
              <label for="admin-date">Date</label>
              <input id="admin-date" data-input="date" type="date" />
            </div>
            <div class="admin-filters__actions">
              <button type="submit" class="btn btn--primary">Load</button>
              <button type="button" class="btn btn--ghost" data-action="clear">Reset</button>
            </div>
          </form>

          <p class="admin-status" data-role="status"></p>
          <div class="admin-results" data-role="reservations">
            <p class="admin-empty">Loading…</p>
          </div>
        </section>

        <section class="admin-card">
          <header class="admin-card__header">
            <h2 class="admin-card__title">Daily schedule</h2>
            <p class="admin-card__subtitle">See bookings for a specific date.</p>
          </header>

          <div class="admin-field admin-field--inline">
            <label for="admin-schedule-date">Date</label>
            <input id="admin-schedule-date" data-input="schedule-date" type="date" />
          </div>
          <div class="admin-schedule" data-role="schedule">
            <p class="admin-empty">Loading…</p>
          </div>
        </section>
      </div>
    </section>
    `;
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

function bindSchedule() {
    if (!refs.scheduleDate) return;
    refs.scheduleDate.value = todayISO();
    refs.scheduleDate.addEventListener("change", () => loadSchedule(refs.scheduleDate.value));
}

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

async function loadSchedule(date = todayISO()) {
    if (!refs.schedule) return;
    renderLoading(refs.schedule, "Loading schedule…");

    try {
        const data = await getDailySchedule(date);
        state.schedule = Array.isArray(data) ? data : [];
        renderSchedule();
    } catch (error) {
        console.error(error);
        renderError(refs.schedule, error);
    }
}

function renderReservationTable() {
    if (!refs.list) return;
    if (!state.reservations.length) {
        refs.list.innerHTML = `<p class="admin-empty">No results. Try adjusting the filters.</p>`;
        return;
    }

    const rows = state.reservations.map((reservation) => {
        const bookings = (reservation.bookings || [])
            .map((item) => `<li>${escapeHtml(item.activityName || "-")}<br><span>${escapeHtml(item.timeSlot || "-")}</span></li>`)
            .join("");

        return `
        <tr data-reservation-id="${reservation.id}">
          <td>${reservation.id}</td>
          <td>${escapeHtml(reservation.contactName || "-")}</td>
          <td>${escapeHtml(reservation.email || "-")}</td>
          <td>${formatPhone(reservation.phone)}</td>
          <td>${escapeHtml(reservation.customerType || "-")}</td>
          <td>${formatDateTime(reservation.createdAt)}</td>
          <td><ul class="admin-booking-list">${bookings || "<li>Ingen bookinger</li>"}</ul></td>
          <td class="admin-table__actions">
            <button type="button" class="btn btn--primary" data-action="delete">Delete</button>
          </td>
        </tr>`;
    }).join("");

    refs.list.innerHTML = `
      <table class="table admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Kontakt</th>
            <th>Email</th>
            <th>Telefon</th>
            <th>Type</th>
            <th>Oprettet</th>
            <th>Bookinger</th>
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

function renderSchedule() {
    if (!refs.schedule) return;
    if (!state.schedule.length) {
        refs.schedule.innerHTML = `<p class="admin-empty">No bookings for the selected date.</p>`;
        return;
    }

    refs.schedule.innerHTML = state.schedule.map((entry) => `
      <article class="admin-schedule__item">
        <header>
          <h3>${escapeHtml(entry.activityName || "Unknown activity")}</h3>
          <span>${formatTimeRange(entry.startsAt, entry.endsAt)}</span>
        </header>
        <p>Participants: ${entry.participants}/${entry.totalParticipants || "?"}</p>
        <p>Contact: ${escapeHtml(entry.contactName || "-")} (${escapeHtml(entry.customerType || "-")})</p>
        <p>Reservation: #${entry.reservationId || "-"}</p>
      </article>
    `).join("");
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
    container.innerHTML = `<p class="admin-empty">${message}</p>`;
}

function renderError(container, error) {
    if (!container) return;
    container.innerHTML = `<p class="admin-empty">${error?.message || "Something went wrong."}</p>`;
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

function formatTimeRange(start, end) {
    const format = (input) => input ? new Date(input).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) : "?";
    return `${format(start)} – ${format(end)}`;
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
