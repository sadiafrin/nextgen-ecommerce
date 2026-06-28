import localforage from 'localforage';

// 🔹 Main config
localforage.config({
  name: 'NextGenEcommerce',
  storeName: 'main_store'
});

// 🔹 আলাদা আলাদা store তৈরি
export const usersStore = localforage.createInstance({
  name: 'NextGenEcommerce',
  storeName: 'users_store'
});

export const ordersStore = localforage.createInstance({
  name: 'NextGenEcommerce',
  storeName: 'orders_store'
});

export const productsStore = localforage.createInstance({
  name: 'NextGenEcommerce',
  storeName: 'products_store'
});

// Default export (main)
export default localforage;
