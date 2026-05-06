// StaySync Hotel Booking System - JavaScript Code
// This file handles all the interactive functionality for the hotel booking website

/* Room data configuration - defines available room types, prices, and availability */
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

// Storage key for saving booking data in browser's localStorage
const storageKey = "staySyncReservations";

/* Loads saved booking records from localStorage - handles empty/invalid data gracefully */
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

/* Saves booking records to localStorage */
function saveReservations(records) {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

/* Finds a room object by its ID from the stayOptions array */
function findRoomById(roomId) {
  return stayOptions.find(function (room) {
    return room.id === roomId;
  });
}

/* Displays room cards on the Available Stays page - shows room details and booking buttons */
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

/* Sets up the booking form - populates dropdown, sets date limits, handles form submission */
function setupBookingForm() {
  const bookingForm = document.getElementById("bookingForm");
  const roomChoice = document.getElementById("roomChoice");
  const bookingMessage = document.getElementById("bookingMessage");

  if (!bookingForm || !roomChoice) return;

  // Set date limits to prevent past dates and future dates beyond year 9999
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("checkInDate").setAttribute("min", today);
  document.getElementById("checkOutDate").setAttribute("min", today);
  document.getElementById("checkInDate").setAttribute("max", "9999-12-31");
  document.getElementById("checkOutDate").setAttribute("max", "9999-12-31");

  // Populate room dropdown with available rooms
  roomChoice.innerHTML = stayOptions.map(function (room) {
    const disabled = room.status === "Fully Booked" ? "disabled" : "";
    return `<option value="${room.id}" ${disabled}>${room.type} - £${room.price} per night</option>`;
  }).join("");

  // Check for pre-selected room from URL parameters (when coming from rooms page)
  const pageRequest = new URLSearchParams(window.location.search);
  const requestedRoom = pageRequest.get("stay");

  if (requestedRoom && findRoomById(requestedRoom)) {
    roomChoice.value = requestedRoom;
  }

  // Handle form submission and validation
  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const checkIn = document.getElementById("checkInDate").value;
    const checkOut = document.getElementById("checkOutDate").value;

    // Validate that dates are selected
    if (!checkIn || !checkOut) {
      bookingMessage.textContent = "Please select valid dates.";
      return;
    }

    const selectedRoom = findRoomById(roomChoice.value);
    if (!selectedRoom) {
      bookingMessage.textContent = "Please select a room.";
      return;
    }

    // Validate that check-out is after check-in
    if (new Date(checkOut) <= new Date(checkIn)) {
      bookingMessage.textContent = "Check-out must be after check-in.";
      return;
    }

    const records = loadReservations();

    // Create new reservation object with all booking details
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

    // Redirect to booking management page after short delay
    setTimeout(function () {
      window.location.href = "manage.html";
    }, 1000);
  });
}

/* Shows bookings for the guest side (manage.html) - displays user's reservations */
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

/* Shows all bookings for staff (admin.html) - displays table with all reservations and edit/remove options */
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

/* Staff login functionality - handles authentication and shows admin panel */
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

/* Staff can edit a booking - prompts for new values and updates the record */
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

/* Staff can remove a booking - deletes the record after confirmation */
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

/* Updates home page booking count display */
function updateHomeSummary() {
  const homeBookingCount = document.getElementById("homeBookingCount");
  if (homeBookingCount) {
    homeBookingCount.textContent = loadReservations().length;
  }
}

 /* Initialize all page functions when DOM is fully loaded */
document.addEventListener("DOMContentLoaded", function () {
  showRooms();
  setupBookingForm();
  showGuestBookings();
  setupStaffLogin();
  updateHomeSummary();
});

