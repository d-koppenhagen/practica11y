const data = [
  { name: 'Alice', role: 'Developer', level: 'Senior' },
  { name: 'Bob', role: 'Designer', level: 'Mid' },
  { name: 'Carol', role: 'Manager', level: 'Lead' },
  { name: 'Dave', role: 'Developer', level: 'Junior' },
  { name: 'Eve', role: 'QA Engineer', level: 'Senior' },
];

let sortCol = null;
let sortDir = 'asc';

document.querySelectorAll('#data-table th[data-sort]').forEach((header) => {
  header.addEventListener('click', () => {
    const col = header.dataset.sort;
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = 'asc';
    }
    renderTable();
  });
});

document.getElementById('filter-input').addEventListener('input', renderTable);

function renderTable() {
  const filter = document.getElementById('filter-input').value.toLowerCase();
  let filtered = data.filter((row) =>
    Object.values(row).some((v) => v.toLowerCase().includes(filter)),
  );

  if (sortCol) {
    filtered.sort((a, b) => {
      const cmp = a[sortCol].localeCompare(b[sortCol]);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const tbody = document.querySelector('#data-table tbody');
  tbody.innerHTML = filtered
    .map(
      (row) =>
        `<tr><td>${row.name}</td><td>${row.role}</td><td>${row.level}</td></tr>`,
    )
    .join('');

  document.getElementById('table-status').textContent =
    `Showing ${filtered.length} of ${data.length} entries`;
}
