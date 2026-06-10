// public/sw.js
const CACHE_NAME = 'nextgen-ecomm-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // নতুন সার্ভিস ওয়ার্কার সাথে সাথে অ্যাক্টিভ হবে
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/'])));
});

self.addEventListener('fetch', (event) => {
  // জাভাস্ক্রিপ্ট বা মডিউল স্ক্রিপ্টের ক্ষেত্রে সরাসরি নেটওয়ার্ক থেকে আনবে (এরর এড়াতে)
  if (event.request.destination === 'script' || event.request.destination === 'style') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => new Response());
    })
  );
});