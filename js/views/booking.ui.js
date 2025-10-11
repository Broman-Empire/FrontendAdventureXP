const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FALLBACK_IMAGES = {
    gokart: "/assets/images/activities/gokart.jpg",
    paintball: "/assets/images/activities/paintball.jpg",
    minigolf: "/assets/images/activities/minigolf.jpg",
    sumowrestling: "/assets/images/activities/sumo_wrestling.jpg",
    sumo_wrestling: "/assets/images/activities/sumo_wrestling.jpg"
};

// shared references
let stateRef;
let refsRef;
let fetchSlotsFn;
let buildPreviewDaysFn;
let handlePreviewDateFn;
let handleSlotSelectFn;
let buildMonthGridFn;
let showStepFn;

// register dependencies
export function setBookingUIDependencies({
    state,
    refs,
    fetchSlots,
    buildPreviewDays,
    handlePreviewDate,
    handleSlotSelect,
    buildMonthGrid,
    showStep
}) {
    stateRef = state;
    refsRef = refs;
    fetchSlotsFn = fetchSlots;
    buildPreviewDaysFn = buildPreviewDays;
    handlePreviewDateFn = handlePreviewDate;
    handleSlotSelectFn = handleSlotSelect;
    buildMonthGridFn = buildMonthGrid;
    showStepFn = showStep;
}

// time display
export const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

export const formatDateHuman = (iso) =>
    new Date(iso).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
    });

// month label
const formatMonthLabel = (date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

function resolveActivityImage(activity) {
    if (!activity) return "";
    if (activity.imageUrl) return activity.imageUrl;
    const key = (activity.name || "").toLowerCase().replace(/\s+/g, ""); // normalize activity name
    return FALLBACK_IMAGES[key] || "/assets/images/activities/activity-placeholder.jpg";
}

// full markup
export function getBookingMarkup() {
    return `
    <section class="booking">
      <button class="booking-close" type="button" data-action="close">×</button>
      <header class="booking__header">
        <h1 class="booking__title">Book Your Adventure</h1>
        <p class="booking__subtitle">Browse available slots, then complete the form to confirm.</p>
      </header>
      <div class="booking__layout">
        <div class="booking-card">
          <section class="booking-step" data-step="type">
            <h2 class="booking-step__title">Step 1 · Customer type</h2>
            <div class="booking-option-group">
              <label class="booking-option booking-option--plain"><input type="radio" name="customer-type" value="private"> <span>Private group</span></label>
              <label class="booking-option booking-option--plain"><input type="radio" name="customer-type" value="company"> <span>Company</span></label>
            </div>
          </section>

          <section class="booking-step booking-step--hidden" data-step="contact">
            <h2 class="booking-step__title">Step 2 · Contact details</h2>
            <div class="booking-contact booking-contact--private" data-scope="private">
              <div class="booking-field"><label for="privateName">Contact name</label><input id="privateName" name="contactName" type="text" required></div>
              <div class="booking-field"><label for="privateEmail">Email</label><input id="privateEmail" name="email" type="email" required></div>
              <div class="booking-field"><label for="privatePhone">Phone number</label><input id="privatePhone" name="phone" type="tel" required></div>
            </div>
            <div class="booking-contact booking-contact--company booking-step--hidden" data-scope="company">
              <div class="booking-field"><label for="companyName">Company name</label><input id="companyName" name="companyName" type="text"></div>
              <div class="booking-field"><label for="cvrNumber">CVR number</label><input id="cvrNumber" name="cvrNumber" type="text"></div>
              <div class="booking-field"><label for="companyContact">Contact name</label><input id="companyContact" name="contactName" type="text" required></div>
              <div class="booking-field"><label for="companyEmail">Email</label><input id="companyEmail" name="email" type="email" required></div>
              <div class="booking-field"><label for="companyPhone">Phone number</label><input id="companyPhone" name="phone" type="tel" required></div>
            </div>
            <div class="booking-step__actions"><button class="btn btn--primary" type="button" data-action="contact-next">Continue</button></div>
          </section>

          <section class="booking-step booking-step--hidden" data-step="slot">
            <h2 class="booking-step__title">Step 3 · Choose slot</h2>
            <div class="booking-field"><label for="activitySelect">Activity</label><select id="activitySelect"></select></div>
            <p class="booking-slot-note" data-role="capacity"></p>
            <div class="booking-results__container" data-role="slots">
              <p class="booking-empty">Select activity and date to see open slots.</p>
            </div>
          </section>

          <section class="booking-step booking-step--hidden" data-step="group">
            <h2 class="booking-step__title">Step 4 · Group details</h2>
            <div class="booking-field">
              <label>Participants</label>
              <div class="booking-counter">
                <button class="booking-counter__btn" type="button" data-counter="-">−</button>
                <div class="booking-counter__display" data-role="participants">1</div>
                <button class="booking-counter__btn" type="button" data-counter="+">+</button>
              </div>
            </div>
            <div class="booking-field"><label for="minAge">Minimum age in group</label><input id="minAge" type="number" min="0" required></div>
            <div class="booking-step__actions"><button class="btn btn--primary btn-booking" type="button" data-action="confirm" disabled>Confirm booking</button></div>
          </section>
        </div>

        <div class="booking-card booking-preview">
          <div class="booking-card__header">
            <h2 class="booking-card__title">Availability</h2>
            <span class="booking-preview__badge booking-preview__badge--empty" data-role="previewBadge"></span>
          </div>

          <div class="booking-preview__controls">
            <label class="booking-preview__activity">
              <span>Activity</span>
              <select data-role="previewActivity"></select>
            </label>
            <div class="booking-preview__nav">
              <button type="button" data-action="preview-prev">‹</button>
              <span data-role="previewMonth"></span>
              <button type="button" data-action="preview-next">›</button>
            </div>
          </div>

          <div class="booking-calendar" data-role="previewCalendar">
            <div class="booking-calendar__weekdays" data-role="previewWeekdays"></div>
            <div class="booking-calendar__grid" data-role="previewGrid"></div>
          </div>

          <div class="booking-preview__slots" data-role="previewSlots">
            <p class="booking-empty">Select a date to see upcoming slots.</p>
          </div>
        </div>
      </div>
    </section>
    <aside class="booking-summary booking-summary--hidden" data-role="summary"></aside>
    `;
}

// slot list
export function renderSlots(container, slots, onSelect, preselectStart) {
    if (!refsRef) return;
    container.innerHTML = "";

    if (!slots.length) {
        container.innerHTML = `<p class="booking-empty">No slots available on this date.</p>`;
        refsRef.capacityNote.textContent = "";
        return;
    }

    const list = document.createElement("div");
    list.className = "booking-results__list";

    slots.forEach((slot, index) => {
        const label = document.createElement("label");
        label.className = "booking-slot";
        label.innerHTML = `
          <input type="radio" name="booking-slot" value="${index}">
          <span class="booking-slot__time">${formatTime(slot.start)} – ${formatTime(slot.end)}</span>
          <span class="booking-slot__meta">Capacity ${slot.capacity} · Available ${slot.remaining}</span>
        `;
        label.querySelector("input").addEventListener("change", () => onSelect(index));
        list.appendChild(label);
    });

    container.appendChild(list);

    // if user chooses to preselect a slot (by shown start time), select it as well on left side (reservation form) == sync right and left sections
    if (preselectStart) {
        const idx = slots.findIndex((slot) => slot.start === preselectStart); // find by start time
        if (idx !== -1) {
            const input = container.querySelectorAll("input[name='booking-slot']")[idx];
            if (input) {
                input.checked = true;
                onSelect(idx);
            }
        }
    }
}

// weekday header
export const renderWeekdayHeader = (container) => {
    container.innerHTML = WEEKDAYS.map((day) => `<span>${day}</span>`).join("");
};

// calendar view
export async function renderPreviewCalendar(preselectDate) {
    if (!stateRef || !refsRef) return;
    const activityId = stateRef.previewActivity;

    // no activity selected
    if (!activityId) {
        refsRef.previewGrid.innerHTML = "<p class=\"booking-empty\">No activities available.</p>";
        refsRef.previewSlots.innerHTML = "<p class=\"booking-empty\">Select an activity to view availability.</p>";
        return;
    }
    // if no days yet, or activity changed, rebuild
    if (!stateRef.previewDays.length || stateRef.previewDays[0].activityId !== activityId) {
        await buildPreviewDaysFn(activityId);
        stateRef.previewDays.forEach((day) => (day.activityId = activityId));
    }

    // render month
    refsRef.previewMonth.textContent = formatMonthLabel(stateRef.previewMonth);
    refsRef.previewGrid.innerHTML = "";

    // render days
    const cells = buildMonthGridFn(stateRef.previewMonth);
    cells.forEach(({ iso, date, inMonth }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "booking-calendar__cell";

        // dim out days not in month
        if (!inMonth) btn.classList.add("booking-calendar__cell--muted");
        if (stateRef.previewDate === iso) btn.classList.add("booking-calendar__cell--selected");
        // highlight days with slots
        const previewDay = stateRef.previewDays.find((day) => day.iso === iso);
        if (previewDay && previewDay.slots.length) btn.classList.add("booking-calendar__cell--open");

        btn.dataset.iso = iso;
        btn.innerHTML = `
          <span class="booking-calendar__day">${date.getDate()}</span>
          ${previewDay && previewDay.slots.length ? `<span class="booking-calendar__dot"></span>` : ""}
        `;
        btn.addEventListener("click", () => handlePreviewDateFn(iso));
        refsRef.previewGrid.appendChild(btn);
    });

    if (preselectDate) handlePreviewDateFn(preselectDate);
}

// preview slots
export async function renderPreviewSlots(isoDate) {
    if (!stateRef || !refsRef) return;
    if (!isoDate) {
        refsRef.previewSlots.innerHTML = "<p class=\"booking-empty\">Select a date to see upcoming slots.</p>";
        return;
    }

    // find day in previewDays (cached) or fetch slots if not found
    const previewDay = stateRef.previewDays.find((day) => day.iso === isoDate);
    const slots = previewDay?.slots || (await fetchSlotsFn(stateRef.previewActivity, isoDate));

    if (!slots.length) {
        refsRef.previewSlots.innerHTML = "<p class=\"booking-empty\">No availability on this day.</p>";
        return;
    }

    refsRef.previewSlots.innerHTML = `
      <h3 class="booking-preview__subtitle">${formatDateHuman(isoDate)}</h3>
      <ul class="booking-preview__list">
        ${slots
            .map(
                (slot, index) => `
          <li>
            <button type="button" class="booking-preview__slot" data-index="${index}" data-start="${slot.start}">
              <span class="booking-preview__time">${formatTime(slot.start)}</span>
              <span class="booking-preview__availability">${slot.remaining} seats left</span>
            </button>
          </li>`
            )
            .join("")}
      </ul>
    `;
    // attach click handlers to each slot button
    refsRef.previewSlots.querySelectorAll(".booking-preview__slot").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const idx = Number(btn.dataset.index);
            const slotsAtDate = await fetchSlotsFn(stateRef.previewActivity, isoDate);

            stateRef.date = isoDate;
            stateRef.activityId = String(stateRef.previewActivity);
            refsRef.activitySelect.value = stateRef.activityId;
            stateRef.slots = slotsAtDate;

            renderSlots(refsRef.slotsContainer, slotsAtDate, handleSlotSelectFn, slotsAtDate[idx].start);

            stateRef.slotIndex = idx;
            handleSlotSelectFn(idx);

            if (stateRef.contactReady) showStepFn(refsRef.steps, "slot");
        });
    });
}

// dropdown options
export function populateActivitySelect(select, activities) {
    select.innerHTML = `<option value="">Select activity</option>${activities
        .map((activity) => `<option value="${activity.id}">${activity.name}</option>`)
        .join("")}`;
}

// preview options
export function populatePreviewActivitySelect(select, activities) {
    select.innerHTML = activities
        .map((activity) => `<option value="${activity.id}">${activity.name}</option>`)
        .join("");
}

// update badge
export function updatePreviewBadge() {
    if (!stateRef || !refsRef) return;
    const activity = stateRef.activities.find((item) => String(item.id) === stateRef.previewActivity);

    if (!activity) {
        refsRef.previewBadge.style.backgroundImage = "";
        refsRef.previewBadge.classList.add("booking-preview__badge--empty");
        return;
    }

    refsRef.previewBadge.classList.remove("booking-preview__badge--empty");
    refsRef.previewBadge.style.backgroundImage = `url('${resolveActivityImage(activity)}')`;
}
