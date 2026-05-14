// Notification utility functions
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    });
  }
  return null;
};

export const scheduleNotification = (title, options = {}, delay = 0) => {
  setTimeout(() => {
    showNotification(title, options);
  }, delay);
};

export const playSound = (soundFile = '/notification.mp3') => {
  if ('Audio' in window) {
    const audio = new Audio(soundFile);
    audio.play().catch(err => console.log('Audio play failed:', err));
  }
};

export const vibrate = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export const showToast = (message, type = 'info', duration = 3000) => {
  // This would integrate with a toast library or custom toast component
  console.log(`Toast (${type}): ${message}`);
  
  // For now, use browser alert as fallback
  if (type === 'error') {
    alert(`Error: ${message}`);
  } else {
    console.log(message);
  }
};