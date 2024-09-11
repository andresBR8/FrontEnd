const DB_NAME = 'ActivosDB';
const DB_VERSION = 1;
const STORES = ['activos', 'unidades', 'queue'];

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  });
};

const getAll = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

const setAll = async (storeName, items) => {
  const db = await openDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  await Promise.all(items.map(item => {
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onerror = (event) => reject(event.target.error);
      request.onsuccess = (event) => resolve(event.target.result);
    });
  }));
};

export const addToQueue = async (action) => {
  const existingQueue = await getAll('queue');
  const db = await openDB();
  const transaction = db.transaction('queue', 'readwrite');
  const store = transaction.objectStore('queue');

  // Evitar agregar acciones duplicadas a la cola
  const isDuplicate = existingQueue.some(
    (queuedAction) => queuedAction.type === action.type && queuedAction.data.id === action.data.id
  );

  if (!isDuplicate) {
    const request = store.add(action);
    return new Promise((resolve, reject) => {
      request.onerror = (event) => reject(event.target.error);
      request.onsuccess = (event) => resolve(event.target.result);
    });
  }
};


export const getActivos = () => getAll('activos');
export const setActivos = (activos) => setAll('activos', activos);
export const getUnidades = () => getAll('unidades');
export const setUnidades = (unidades) => setAll('unidades', unidades);
export const getQueue = () => getAll('queue');
export const clearQueue = async () => {
  const db = await openDB();
  const transaction = db.transaction('queue', 'readwrite');
  const store = transaction.objectStore('queue');
  const request = store.clear();
  
  return new Promise((resolve, reject) => {
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

