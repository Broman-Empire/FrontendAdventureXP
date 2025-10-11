
import { navigation } from "../main.js";
import { getActivities, getAvailabilityForDay, postReservation } from "../api.js";
import {
    setBookingUIDependencies,
    getBookingMarkup,
    renderSlots,
    renderWeekdayHeader,
    renderPreviewCalendar,
    renderPreviewSlots,
    populateActivitySelect,
    populatePreviewActivitySelect,
    updatePreviewBadge,
    formatDateHuman,
    formatTime
} from "./booking.ui.js";

// calendar settings
const MAX_PREVIEW_LOOKAHEAD = 21; // days
const CALENDAR_CELLS = 42; // 6 weeks

const initialState = {
    activities: [],
    customerType: null,
    contact: {},
    contactReady: false,
    participants: 1,
    minAge: "",
    activityId: "",
    date: "",
    slotIndex: null,
    slots: [],
    previewActivity: "",
    previewMonth: null,
    previewDate: "",
    previewDays: []
};

// mutable state
const state = { ...initialState };
let refs = {};

// month helper
function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function resetState() {
    Object.assign(state, {
        ...initialState,
        previewMonth: startOfMonth(new Date())
    });
}

// show/hide steps
function showStep(steps, activeKey) {
    Object.entries(steps).forEach(([key, section]) => {
        const shouldHide = key !== activeKey && !section.classList.contains("booking-step--revealed");
        section.classList.toggle("booking-step--hidden", shouldHide);
    });
}
// reveal step permanently
function revealStep(stepKey) {
    const step = refs.steps[stepKey];
    if (!step) return;
    step.classList.add("booking-step--revealed");
    step.classList.remove("booking-step--hidden");
}

// collect inputs
function collectInputs(inputs) {
    const values = {};
    let valid = true;

    inputs.forEach((input) => {
        const value = input.value.trim();
        if (input.required && !value) valid = false; // check required
        values[input.name || input.id] = value; // prefer name, fallback to id
    });

    return { valid, values };
}

// iso helper
const formatDateISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// calendar grid
function buildMonthGrid(monthDate) {
    const first = startOfMonth(monthDate);
    const anchor = new Date(first);
    anchor.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // back to Monday

    return Array.from({ length: CALENDAR_CELLS }, (_, index) => { // 42 cells (6 weeks)
        const day = new Date(anchor);
        day.setDate(anchor.getDate() + index); // increment day
        return {
            iso: formatDateISO(day),
            date: day,
            inMonth: day.getMonth() === monthDate.getMonth()
        };
    });
}

async function fetchSlots(activityId, isoDate) {
    if (!activityId || !isoDate) return [];
    const response = await getAvailabilityForDay(activityId, isoDate).catch(() => []);
    return (response || []).filter((slot) => !slot.soldOut);
}

// preload days
async function buildPreviewDays(activityId) {
    const days = [];
    const today = new Date();

    // for each loop that looks ahead
    for (let offset = 0; offset < MAX_PREVIEW_LOOKAHEAD; offset += 1) { // next 21 days
        const day = new Date(today);
        day.setDate(today.getDate() + offset);
        const iso = formatDateISO(day);
        const slots = await fetchSlots(activityId, iso);
        days.push({ iso, slots });
    }

    state.previewDays = days;
}

// set preview date
async function handlePreviewDate(isoDate) {
    state.previewDate = isoDate;
    await renderPreviewCalendar();
    await renderPreviewSlots(state.previewDate);
}

// choose slot
function handleSlotSelect(index) {
    state.slotIndex = index;
    const slot = state.slots[index];
    if (!slot) return;

    // show capacity
    refs.capacityNote.textContent = `Seats available: ${slot.remaining} (capacity ${slot.capacity})`;

    // if contact not ready, go back to contact step
    if (!state.contactReady) {
        showStep(refs.steps, "contact");
        return;
    }

    showStep(refs.steps, "group");
    refs.confirmBtn.disabled = false;
}

// clear contacts
function resetContactForms() {
    [...refs.privateInputs, ...refs.companyInputs].forEach((input) => {
        input.value = ""; // clear value
    });
    state.contactReady = false;
}

// submit booking
async function submitReservation(payload) {
    const reservation = await postReservation(payload);

    // if we have activity and date, refresh slots
    if (state.activityId && state.date) {
        state.slots = await fetchSlots(state.activityId, state.date); // refresh slots
        renderSlots(refs.slotsContainer, state.slots, handleSlotSelect); // re-render slots
        state.slotIndex = null;
        refs.capacityNote.textContent = ""; // clear capacity note
    }

    // if preview activity matches current activity, update preview days
    if (state.previewActivity === state.activityId) {
        const previewDay = state.previewDays.find((day) => day.iso === state.date); // find matching day
        if (previewDay) previewDay.slots = state.slots;
        await renderPreviewCalendar();
        await renderPreviewSlots(state.previewDate || state.date || ""); // re-render preview slots
    }

    return reservation;
}

function setPreviewDependencies() {
    setBookingUIDependencies({
        state,
        refs,
        fetchSlots,
        buildPreviewDays,
        handlePreviewDate,
        handleSlotSelect,
        buildMonthGrid,
        showStep
    });
}

export async function mount(container) {
    resetState();

    state.activities = await getActivities().catch(() => []);
    state.previewActivity = state.activities[0]?.id ? String(state.activities[0].id) : "";

    container.innerHTML = getBookingMarkup();

    refs = {
        typeStep: container.querySelector("[data-step='type']"),
        steps: {
            type: container.querySelector("[data-step='type']"),
            contact: container.querySelector("[data-step='contact']"),
            slot: container.querySelector("[data-step='slot']"),
            group: container.querySelector("[data-step='group']")
        },
        contactHint: container.querySelector("[data-role='contactHint']"),
        privateInputs: [...container.querySelector("[data-scope='private']").querySelectorAll("input")],
        companyInputs: [...container.querySelector("[data-scope='company']").querySelectorAll("input")],
        privateFields: container.querySelector("[data-scope='private']"),
        companyFields: container.querySelector("[data-scope='company']"),
        participants: container.querySelector("[data-role='participants']"),
        minAge: container.querySelector("#minAge"),
        activitySelect: container.querySelector("#activitySelect"),
        slotsContainer: container.querySelector("[data-role='slots']"),
        confirmBtn: container.querySelector("[data-action='confirm']"),
        capacityNote: container.querySelector("[data-role='capacity']"),
        previewActivity: container.querySelector("[data-role='previewActivity']"),
        previewMonth: container.querySelector("[data-role='previewMonth']"),
        previewWeekdays: container.querySelector("[data-role='previewWeekdays']"),
        previewGrid: container.querySelector("[data-role='previewGrid']"),
        previewSlots: container.querySelector("[data-role='previewSlots']"),
        previewBadge: container.querySelector("[data-role='previewBadge']"),
        previewPrev: container.querySelector("[data-action='preview-prev']"),
        previewNext: container.querySelector("[data-action='preview-next']"),
        closeBtn: container.querySelector("[data-action='close']"),
        summary: container.parentElement.querySelector("[data-role='summary']"),
        container
    };

    setPreviewDependencies();

    // unlock step 1 by default
    refs.steps.type.classList.add("booking-step--revealed");

    // close button returns to frontpage
    refs.closeBtn.addEventListener("click", () => navigation("frontpage"));

    // setup dropdowns and calendar
    renderWeekdayHeader(refs.previewWeekdays);
    populateActivitySelect(refs.activitySelect, state.activities);

    if (state.previewActivity) {
        populatePreviewActivitySelect(refs.previewActivity, state.activities);
        refs.previewActivity.value = state.previewActivity;
        updatePreviewBadge();
        await renderPreviewCalendar();
    } else {
        refs.previewActivity.innerHTML = "";
        updatePreviewBadge();
    }

    // event listeners

    // customer type change
    container.querySelectorAll("input[name='customer-type']").forEach((radio) => {
        radio.addEventListener("change", () => {
            if (state.customerType !== radio.value) resetContactForms();

            state.customerType = radio.value;
            const isCompany = state.customerType === "company";

            refs.companyFields.classList.toggle("booking-step--hidden", !isCompany);
            refs.privateFields.classList.toggle("booking-step--hidden", isCompany);
            revealStep("contact");
            showStep(refs.steps, "contact");
        });
    });

    container.querySelector("[data-action='contact-next']").addEventListener("click", () => {
        if (!state.customerType) {
            alert("Please choose customer type first.");
            showStep(refs.steps, "type");
            return;
        }

        // collect input values
        const inputs = state.customerType === "company" ? refs.companyInputs : refs.privateInputs;
        const { valid, values } = collectInputs(inputs);

        // if not valid, show errors and return
        if (!valid) {
            showStep(refs.steps, "contact");
            inputs.forEach((input) => input.reportValidity());
            return;
        }

        // build contact object
        state.contact =
            state.customerType === "company"
                ? {
                      type: "company",
                      companyName: values.companyName || "",
                      cvrNumber: values.cvrNumber || "",
                      contactName: values.contactName
                          ? `${values.companyName || ""}${values.companyName ? "; " : ""}${values.contactName}` // combine names to one string (not handled on server-side)
                          : values.companyName || "",
                      email: values.email,
                      phone: values.phone
                  }
                : {
                      type: "private",
                      contactName: values.contactName,
                      email: values.email,
                      phone: values.phone
                  };

        state.contactReady = true;
        revealStep("slot");
        revealStep("group");
        showStep(refs.steps, "slot");
    });

    // participant counter
    container.querySelectorAll("[data-counter]").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.dataset.counter === "+") state.participants += 1;
            if (btn.dataset.counter === "-" && state.participants > 1) state.participants -= 1;
            refs.participants.textContent = state.participants;
        });
    });

    // activity select change
    refs.activitySelect.addEventListener("change", async () => {
        state.activityId = refs.activitySelect.value;
        state.date = "";
        state.slotIndex = null;
        refs.capacityNote.textContent = "";
        refs.slotsContainer.innerHTML = `<p class="booking-empty">Pick a date to see available times →</p>`;

        if (state.activityId) {
            state.slots = await fetchSlots(state.activityId, state.date);
        }
    });

    // preview activity change
    refs.previewActivity.addEventListener("change", async () => {
        state.previewActivity = refs.previewActivity.value;
        state.previewMonth = startOfMonth(new Date(state.previewMonth));
        state.previewDate = "";
        state.previewDays = [];
        updatePreviewBadge();
        await renderPreviewCalendar();
        await renderPreviewSlots("");
        if (state.contactReady) {
            revealStep("slot");
            revealStep("group");
            showStep(refs.steps, "slot");
        }
    });

    // preview month navigation
    refs.previewPrev.addEventListener("click", async () => {
        state.previewMonth = addMonths(state.previewMonth, -1); // previous month
        await renderPreviewCalendar();
    });

    refs.previewNext.addEventListener("click", async () => {
        state.previewMonth = addMonths(state.previewMonth, 1); // next month
        await renderPreviewCalendar();
    });

    // slot selection
    refs.confirmBtn.addEventListener("click", async () => {
        if (state.slotIndex === null) {
            alert("Select a slot first.");
            return;
        }

        const slot = state.slots[state.slotIndex];
        const activity = state.activities.find((item) => String(item.id) === state.activityId); // find selected activity

        if (activity?.minAge && state.minAge < activity.minAge) {
            alert(`Minimum age for ${activity.name} is ${activity.minAge}.`);
            return;
        }

        if (state.participants > slot.remaining) {
            alert("Too many participants for that slot.");
            return;
        }

        // populate summary for confirmation
        refs.summary.innerHTML = `
          <div class="booking-summary__panel">
            <h3>Review Booking</h3>
            <p><strong>Activity:</strong> ${activity?.name || "Unknown"}</p>
            <p><strong>Date:</strong> ${formatDateHuman(state.date)}</p>
            <p><strong>Time:</strong> ${formatTime(slot.start)}</p>
            <p><strong>Participants:</strong> ${state.participants}</p>
            <div class="booking-summary__actions">
              <button type="button" class="btn" data-action="summary-confirm">Looks good</button>
              <button type="button" class="btn btn--ghost" data-action="summary-edit">Make changes</button>
            </div>
          </div>
        `;
        refs.summary.classList.remove("booking-summary--hidden");
        refs.summary.dataset.slotIndex = String(state.slotIndex);
    });

    // summary actions (edit or confirm)
    refs.summary.addEventListener("click", async (event) => {
        const target = event.target;
        if (target.matches("[data-action='summary-edit']")) {
            refs.summary.classList.add("booking-summary--hidden"); // hide summary
            refs.confirmBtn.disabled = false; // re-enable confirm button
            showStep(refs.steps, "slot"); // go back to slot selection
            return;
        }
        // confirm booking
        if (target.matches("[data-action='summary-confirm']")) {
            const index = Number(refs.summary.dataset.slotIndex || state.slotIndex);
            const slot = state.slots[index];
            if (!slot) return;

            const originalText = target.textContent;
            target.disabled = true;
            target.textContent = "Booking...";

            try {
                const reservation = await submitReservation({
                    customerType: state.customerType,
                    contact: state.contact,
                    participants: state.participants,
                    minAge: state.minAge,
                    activityId: state.activityId,
                    start: slot.start,
                    end: slot.end
                });

                // reset state except activities and preview
                refs.summary.classList.add("booking-summary--hidden");
                delete refs.summary.dataset.slotIndex;
                refs.confirmBtn.disabled = true;
                revealStep("group");
                showStep(refs.steps, "group");
                alert(
                    reservation?.reference // show reference if available
                        ? `Booking confirmed! Reference: ${reservation.reference}`
                        : "Booking confirmed! Your slot is now reserved."
                );
                // if error in response from server:
            } catch (error) {
                console.error(error);
                alert(`Booking failed: ${error?.message || "Please try again."}`);
                refs.confirmBtn.disabled = false;
            } finally {
                target.disabled = false;
                target.textContent = originalText; 
            }
        }
    });

    // min age input
    refs.minAge.addEventListener("change", (event) => {
        state.minAge = Number(event.target.value) || 0;
    });
}
