let count = 0;
document.getElementById('add-notification').addEventListener('click', () => {
  count++;
  const notification = document.createElement('div', {
    className: 'notification',
  });
  notification.textContent = `Notification ${count}: Your action was successful!`;
  document.getElementById('notification-area').appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => notification.remove(), 5000);
});
