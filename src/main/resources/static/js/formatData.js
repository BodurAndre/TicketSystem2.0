// formatData.js

function formatDate(date) {
    var options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function updateDateElement(supportId, date) {
    var formattedDate = formatDate(date);
    document.getElementById("date_" + supportId).textContent = formattedDate;
}