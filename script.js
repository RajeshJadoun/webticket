// ⚠️ IMPORTANT: Replace this URL with your Google Apps Script Web App URL
const webAppURL = "https://script.google.com/macros/s/AKfycbyiH9WkCf0p8HUA4jL5-veLFqaizfjNKCgqh95mxJBYFubF6oZlXwZPoG84b7t07LkyOA/exec";

// Show Toast Notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (type === 'error') {
    toast.style.background = '#e74c3c';
  }
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// File selection handler
document.getElementById('fileAttachment').addEventListener('change', function(e) {
  const fileName = e.target.files[0]?.name;
  const fileNameDiv = document.getElementById('fileName');
  if (fileName) {
    fileNameDiv.textContent = '✓ ' + fileName;
    fileNameDiv.style.display = 'block';
  } else {
    fileNameDiv.style.display = 'none';
  }
});

// Convert file to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Format timestamp
function formatTime(timestamp) {
  if (!timestamp) {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Load Tickets
function loadTickets() {
  fetch(webAppURL)
    .then(res => res.json())
    .then(data => {
      renderTickets(data);
      updateStats(data);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("ticketList").innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-text">Failed to load tickets</div>
          <div class="empty-state-subtext">Please check your connection or Web App URL.</div>
        </div>
      `;
    });
}

// Update Stats
function updateStats(tickets) {
  document.getElementById('activeCount').textContent = tickets.length;
  document.getElementById('totalCount').textContent = tickets.length;
}

// Render Tickets in Table
function renderTickets(tickets) {
  const container = document.getElementById("ticketList");
  
  if (tickets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-text">No Active Tickets</div>
        <div class="empty-state-subtext">All caught up! Great work.</div>
      </div>
    `;
    return;
  }

  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Raised By</th>
          <th>Raised For</th>
          <th>Assigned To</th>
          <th>Issue</th>
          <th>Attachment</th>
          <th>Raised At</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  tickets.forEach(ticket => {
    const attachmentHTML = ticket.attachmentUrl 
      ? `<a href="${ticket.attachmentUrl}" target="_blank" class="view-btn">👁️ View</a>`
      : `<span class="no-attachment">No file</span>`;

    tableHTML += `
      <tr>
        <td class="ticket-id">#${ticket.id}</td>
        <td class="ticket-name">${ticket.raisedBy || 'N/A'}</td>
        <td class="ticket-name">${ticket.raisedFor || 'N/A'}</td>
        <td class="ticket-name">${ticket.assignedTo || 'N/A'}</td>
        <td class="ticket-issue">${ticket.issue}</td>
        <td>${attachmentHTML}</td>
        <td class="ticket-time">${formatTime(ticket.date)}</td>
        <td>
          <button class="resolve-btn" onclick="resolveTicket(${ticket.id})">
            ✓ Resolve
          </button>
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
}

// Submit Form
document.getElementById("ticketForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  
  const raisedBy = document.getElementById("raisedBy").value;
  const raisedFor = document.getElementById("raisedFor").value;
  const assignedTo = document.getElementById("assignedTo").value;
  const issue = document.getElementById("issue").value;
  const fileInput = document.getElementById("fileAttachment");
  
  let attachment = null;
  let fileName = null;
  
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    fileName = file.name;
    try {
      attachment = await fileToBase64(file);
    } catch (error) {
      showToast("File upload failed!", "error");
      return;
    }
  }

  const ticketData = {
    action: "add",
    raisedBy: raisedBy,
    raisedFor: raisedFor,
    assignedTo: assignedTo,
    issue: issue,
    attachment: attachment,
    fileName: fileName,
    timestamp: new Date().toISOString()
  };

  fetch(webAppURL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(ticketData),
    headers: { "Content-Type": "application/json" }
  });

  showToast("✓ Ticket raised successfully!");
  document.getElementById("ticketForm").reset();
  document.getElementById('fileName').style.display = 'none';
  
  setTimeout(() => {
    loadTickets();
  }, 1500);
});

// Resolve Ticket
function resolveTicket(id) {
  fetch(webAppURL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({action: "resolve", id: id}),
    headers: { "Content-Type": "application/json" }
  });

  showToast("✓ Ticket resolved successfully!");
  
  setTimeout(() => {
    loadTickets();
  }, 1500);
}

// Initial load
loadTickets();

// Auto-refresh every 30 seconds
setInterval(loadTickets, 30000);
