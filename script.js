/* StaySync room data used across the pages */
const stayOptions = [
  {
    id: "single",
    type: "Single Room",
    price: 80,
    status: "Available",
    badgeClass: "status-ready",
    summary: "A simple room for one guest, with a bed, desk, bathroom, and basic storage."
  },
  {
    id: "double",
    type: "Double Room",
    price: 120,
    status: "Few Left",
    badgeClass: "status-limited",
    summary: "A room for one or two guests with one larger bed and standard hotel facilities."
  },
  {
    id: "twin",
    type: "Twin Room",
    price: 140,
    status: "Available",
    badgeClass: "status-ready",
    summary: "A room with two separate beds, useful for friends, classmates, or work trips."
  },
  {
    id: "family",
    type: "Family Room",
    price: 180,
    status: "Fully Booked",
    badgeClass: "status-full",
    summary: "A larger room made for families or groups. This room is currently fully booked."
  }
];

// ONE consistent storage key
const storageKey = "staySyncReservations";

/* Loads saved booking records - handles empty/invalid data */
function loadReservations() {
  try {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (e) {
    console.error("Error loading reservations:", e);
  }
  return [];
}

/* Saves booking records */
function saveReservations(records) {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

/* Finds the chosen room */
function findRoomById(roomId) {
  return stayOptions.find(function (room) {
    return room.id === roomId;
  });
}

/* Shows room cards on Available Stays page */
function showRooms() {
  const roomList = document.getElementById("roomList");
  if (!roomList) return;

  roomList.innerHTML = stayOptions.map(function (room) {
    const isFull = room.status === "Fully Booked";
    const buttonText = isFull ? "View Status" : "Reserve Room";
    const buttonClass = isFull ? "ghost-action" : "primary-action";

    return `
      <article class="room-card">
        <div class="room-topline">
          <div>
            <h3>${room.type}</h3>
            <span class="price">£${room.price}<span> / night</span></span>
          </div>
          <span class="status-badge ${room.badgeClass}">${room.status}</span>
        </div>
        <p>${room.summary}</p>
        <a class="${buttonClass}" href="booking.html?stay=${room.id}">${buttonText}</a>
      </article>
    `;
  }).join("");
}

/* Sets up the booking form */
function setupBookingForm() {
  const bookingForm = document.getElementById("bookingForm");
  const roomChoice = document.getElementById("roomChoice");
  const bookingMessage = document.getElementById("bookingMessage");

  if (!bookingForm || !roomChoice) return;

  // Populate room dropdown
  roomChoice.innerHTML = stayOptions.map(function (room) {
    const disabled = room.status === "Fully Booked" ? "disabled" : "";
    return `<option value="${room.id}" ${disabled}>${room.type} - £${room.price} per night</option>`;
  }).join("");

  // Check for pre-selected room from URL
  const pageRequest = new URLSearchParams(window.location.search);
  const requestedRoom = pageRequest.get("stay");

  if (requestedRoom && findRoomById(requestedRoom)) {
    roomChoice.value = requestedRoom;
  }

  // Handle form submission
  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedRoom = findRoomById(roomChoice.value);
    if (!selectedRoom) {
      bookingMessage.textContent = "Please select a room.";
      return;
    }

    const checkIn = document.getElementById("checkInDate").value;
    const checkOut = document.getElementById("checkOutDate").value;

    // Validate dates
    if (new Date(checkOut) <= new Date(checkIn)) {
      bookingMessage.textContent = "Check-out must be after check-in.";
      return;
    }

    const records = loadReservations();

    const newReservation = {
      recordId: "SS-" + Math.floor(1000000 + Math.random() * 9000000),
      roomNumber: Math.floor(100 + Math.random() * 900),
      guestName: document.getElementById("guestName").value.trim(),
      guestEmail: document.getElementById("guestEmail").value.trim(),
      roomId: selectedRoom.id,
      roomType: selectedRoom.type,
      price: selectedRoom.price,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestCount: document.getElementById("guestCount").value
    };

    records.push(newReservation);
    saveReservations(records);

    bookingMessage.textContent = "Reservation saved! Redirecting...";
    bookingMessage.style.color = "green";

    setTimeout(function () {
      window.location.href = "manage.html";
    }, 1000);
  });
}

/* Shows bookings for the guest side (manage.html) */
function showGuestBookings() {
  const guestReservationList = document.getElementById("guestReservationList");
  if (!guestReservationList) return;

  const records = loadReservations();

  if (records.length === 0) {
    guestReservationList.innerHTML = '<div class="empty-state">No bookings saved yet. Create one from Reserve a Room.</div>';
    return;
  }

  guestReservationList.innerHTML = records.map(function (booking) {
    return `
      <article class="booking-item">
        <div>
          <h3>${booking.roomType}</h3>
          <div class="booking-meta">
            <span>${booking.guestName}</span>
            <span>${booking.checkInDate} to ${booking.checkOutDate}</span>
            <span>£${booking.price} per night</span>
          </div>
        </div>
        <span class="status-badge status-ready">${booking.recordId}</span>
      </article>
    `;
  }).join("");
}

/* Shows all bookings for staff (admin.html) */
function showStaffBookings() {
  const adminRecordTable = document.getElementById("adminRecordTable");
  const adminRecordCount = document.getElementById("adminRecordCount");
  if (!adminRecordTable) return;

  const records = loadReservations();

  if (adminRecordCount) {
    adminRecordCount.textContent = records.length + " records";
  }

  if (records.length === 0) {
    adminRecordTable.innerHTML = `
      <tr>
        <td colspan="5">No booking records are currently stored in this browser.</td>
      </tr>
    `;
    return;
  }

  adminRecordTable.innerHTML = records.map(function (booking) {
    return `
      <tr>
        <td>${booking.guestName}<br><small>${booking.guestEmail}</small></td>
        <td>${booking.roomType} (Room ${booking.roomNumber})<br><small>£${booking.price} per night</small></td>
        <td>${booking.checkInDate} to ${booking.checkOutDate}</td>
        <td>${booking.guestCount}</td>
        <td>
          ${booking.recordId}<br>
          <button onclick="editReservation('${booking.recordId}')">Edit</button>
          <button onclick="removeReservation('${booking.recordId}')">Remove</button>
        </td>
      </tr>
    `;
  }).join("");
}

/* Staff login */
function setupStaffLogin() {
  const staffLoginForm = document.getElementById("staffLoginForm");
  const staffLoginCard = document.getElementById("staffLoginCard");
  const staffRecordsCard = document.getElementById("staffRecordsCard");
  const staffLoginMessage = document.getElementById("staffLoginMessage");

  if (!staffLoginForm || !staffRecordsCard) return;

  staffLoginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const staffCode = document.getElementById("staffCode").value;

    if (staffCode === "staff123") {
      staffLoginCard.classList.add("hidden");
      staffRecordsCard.classList.remove("hidden");
      showStaffBookings();
    } else {
      staffLoginMessage.textContent = "Incorrect staff code.";
    }
  });
}

/* Staff can edit a booking - now with room + dates */
function editReservation(recordId) {
  const records = loadReservations();
  const booking = records.find(function (item) {
    return item.recordId === recordId;
  });

  if (!booking) {
    alert("Booking not found.");
    return;
  }

  const newName = prompt("Guest name:", booking.guestName);
  if (newName === null) return; // User cancelled

  const newCount = prompt("Guest count:", booking.guestCount);
  if (newCount === null) return; // User cancelled
  

  const newRoom = prompt("Room type (Single/Double/Twin):", booking.roomType);
  if (newRoom === null) return; // User cancelled

  const newCheckIn = prompt("Check-in date (YYYY-MM-DD):", booking.checkInDate);
  if (newCheckIn === null) return; // User cancelled

  const newCheckOut = prompt("Check-out date (YYYY-MM-DD):", booking.checkOutDate);
  if (newCheckOut === null) return; // User cancelled

  if (newName) booking.guestName = newName;
  if (newCount) booking.guestCount = newCount;
  if (newRoom) booking.roomType = newRoom;
  if (newCheckIn) booking.checkInDate = newCheckIn;
  if (newCheckOut) booking.checkOutDate = newCheckOut;

  saveReservations(records);
  showStaffBookings();
  showGuestBookings();
  updateHomeSummary();

  alert("Booking updated successfully!");
}

/* Staff can remove a booking */
function removeReservation(recordId) {
  const confirmDelete = confirm("Remove this booking record?");
  if (!confirmDelete) return;

  const records = loadReservations().filter(function (booking) {
    return booking.recordId !== recordId;
  });

  saveReservations(records);
  showStaffBookings();
  showGuestBookings();
  updateHomeSummary();

  alert("Booking removed successfully!");
}

/* Updates home page numbers */
function updateHomeSummary() {
  const homeBookingCount = document.getElementById("homeBookingCount");
  if (homeBookingCount) {
    homeBookingCount.textContent = loadReservations().length;
  }
}

/* Runs the correct page code */
showRooms();
setupBookingForm();
showGuestBookings();
setupStaffLogin();
updateHomeSummary();

/* Finds the chosen room */
function findRoomById(roomId) {
  return stayOptions.find(function (room) {
    return room.id === roomId;
  });
}

/* Shows room cards on Available Stays page */
function showRooms() {
  const roomList = document.getElementById("roomList");
  if (!roomList) return;

  roomList.innerHTML = stayOptions.map(function (room) {
    const isFull = room.status === "Fully Booked";
    const buttonText = isFull ? "View Status" : "Reserve Room";
    const buttonClass = isFull ? "ghost-action" : "primary-action";

    return `
      <article class="room-card">
        <div class="room-topline">
          <div>
            <h3>${room.type}</h3>
            <span class="price">£${room.price}<span> / night</span></span>
          </div>
          <span class="status-badge ${room.badgeClass}">${room.status}</span>
        </div>
        <p>${room.summary}</p>
        <a class="${buttonClass}" href="booking.html?stay=${room.id}">${buttonText}</a>
      </article>
    `;
  }).join("");
}

/* Sets up the booking form */
function setupBookingForm() {
  const bookingForm = document.getElementById("bookingForm");
  const roomChoice = document.getElementById("roomChoice");
  const bookingMessage = document.getElementById("bookingMessage");

  if (!bookingForm || !roomChoice) return;

  roomChoice.innerHTML = stayOptions.map(function (room) {
    const disabled = room.status === "Fully Booked" ? "disabled" : "";
    return `<option value="${room.id}" ${disabled}>${room.type} - £${room.price} per night</option>`;
  }).join("");

  const pageRequest = new URLSearchParams(window.location.search);
  const requestedRoom = pageRequest.get("stay");

  if (requestedRoom && findRoomById(requestedRoom)) {
    roomChoice.value = requestedRoom;
  }

  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedRoom = findRoomById(roomChoice.value);
    const records = loadReservations();

    const newReservation = {
      recordId: "SS-" + Date.now(),
      guestName: document.getElementById("guestName").value,
      guestEmail: document.getElementById("guestEmail").value,
      roomId: selectedRoom.id,
      roomType: selectedRoom.type,
      price: selectedRoom.price,
      checkInDate: document.getElementById("checkInDate").value,
      checkOutDate: document.getElementById("checkOutDate").value,
      guestCount: document.getElementById("guestCount").value,
      arrivalNote: document.getElementById("arrivalNote").value || "No note added"
    };

    records.push(newReservation);
    saveReservations(records);

    bookingMessage.textContent = "Reservation saved. Opening Booking Desk...";
    setTimeout(function () {
      window.location.href = "manage.html";
    }, 800);
  });
}

/* Shows bookings for the guest side */
function showGuestBookings() {
  const guestReservationList = document.getElementById("guestReservationList");
  if (!guestReservationList) return;

  const records = loadReservations();

  if (records.length === 0) {
    guestReservationList.innerHTML = `<div class="empty-state">No bookings saved yet. Create one from Reserve a Room.</div>`;
    return;
  }

  guestReservationList.innerHTML = records.map(function (booking) {
    return `
      <article class="booking-item">
        <div>
          <h3>${booking.roomType}</h3>
          <div class="booking-meta">
            <span>${booking.guestName}</span>
            <span>${booking.checkInDate} to ${booking.checkOutDate}</span>
            <span>£${booking.price} per night</span>
          </div>
          <p>${booking.arrivalNote}</p>
        </div>
        <span class="status-badge status-ready">${booking.recordId}</span>
      </article>
    `;
  }).join("");
}

/* Shows all bookings for staff */
function showStaffBookings() {
  const adminRecordTable = document.getElementById("adminRecordTable");
  const adminRecordCount = document.getElementById("adminRecordCount");
  if (!adminRecordTable) return;

  const records = loadReservations();

  if (adminRecordCount) {
    adminRecordCount.textContent = records.length + " records";
  }

  if (records.length === 0) {
    adminRecordTable.innerHTML = `
      <tr>
        <td colspan="5">No booking records are currently stored in this browser.</td>
      </tr>
    `;
    return;
  }

  adminRecordTable.innerHTML = records.map(function (booking) {
    return `
      <tr>
        <td>${booking.guestName}<br><small>${booking.guestEmail}</small></td>
        <td>${booking.roomType}<br><small>£${booking.price} per night</small></td>
        <td>${booking.checkInDate} to ${booking.checkOutDate}</td>
        <td>${booking.guestCount}</td>
        <td>
          ${booking.recordId}<br>
          <button onclick="editReservation('${booking.recordId}')">Edit</button>
          <button onclick="removeReservation('${booking.recordId}')">Remove</button>
        </td>
      </tr>
    `;
  }).join("");
}

/* Staff login */
function setupStaffLogin() {
  const staffLoginForm = document.getElementById("staffLoginForm");
  const staffLoginCard = document.getElementById("staffLoginCard");
  const staffRecordsCard = document.getElementById("staffRecordsCard");
  const staffLoginMessage = document.getElementById("staffLoginMessage");

  if (!staffLoginForm || !staffRecordsCard) return;

  staffLoginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const staffCode = document.getElementById("staffCode").value;

    if (staffCode === "staff123") {
      staffLoginCard.classList.add("hidden");
      staffRecordsCard.classList.remove("hidden");
      showStaffBookings();
    } else {
      staffLoginMessage.textContent = "Incorrect staff code.";
    }
  });
}

/* Updates home page numbers */
function updateHomeSummary() {
  const homeBookingCount = document.getElementById("homeBookingCount");
  if (homeBookingCount) {
    homeBookingCount.textContent = loadReservations().length;
  }
}

/* Runs the correct page code */
showRooms();
setupBookingForm();
showGuestBookings();
setupStaffLogin();
updateHomeSummary();