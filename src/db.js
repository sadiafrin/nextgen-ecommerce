import localforage from 'localforage';

// 🔹 Main config
localforage.config({
  name: 'NextGenEcommerce',
  storeName: 'main_store'
});

// 🔹 আলাদা আলাদা store
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

// ✅ Metrics store (newCustomers, totalOrders, monthlySales, totalLogins)
export const metricsStore = localforage.createInstance({
  name: 'NextGenEcommerce',
  storeName: 'metrics_store'
});

export default localforage;
