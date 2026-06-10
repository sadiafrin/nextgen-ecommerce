import localforage from 'localforage';

localforage.config({
  name: 'NextGenEcommerce',
  storeName: 'products_store'
});

export default localforage;