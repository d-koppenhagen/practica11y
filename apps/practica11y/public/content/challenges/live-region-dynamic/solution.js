let count = 0;
document.getElementById('add-notification').addEventListener('click', () => {
  count++;
  const message = `Notification ${count}: Your action was successful!`;

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.getElementById('notification-area').appendChild(notification);

  // Announce via the persistent live region
  document.getElementById('live-announcer').textContent = message;

  // Remove after 5 seconds
  setTimeout(() => notification.remove(), 5000);
});
