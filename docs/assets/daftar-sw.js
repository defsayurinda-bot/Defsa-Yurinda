/* Pasang service worker supaya halaman yang pernah dibuka tetap tampil tanpa jaringan. */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* tanpa mode offline */ });
  });
}
