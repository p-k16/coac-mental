// Migrations IndexedDB. Ne jamais modifier une étape existante : ajouter une étape.
export const DB_NAME = 'coachbad';
export const DB_VERSION = 1;

export function migrate(db, oldVersion) {
  if (oldVersion < 1) {
    db.createObjectStore('meta', { keyPath: 'key' });
    db.createObjectStore('profile', { keyPath: 'id' });

    const checkins = db.createObjectStore('checkins', { keyPath: 'id' });
    checkins.createIndex('date', 'date', { unique: true });

    db.createObjectStore('tournaments', { keyPath: 'id' }).createIndex('start', 'start');
    db.createObjectStore('matches', { keyPath: 'id' }).createIndex('date', 'date');
    db.createObjectStore('experiments', { keyPath: 'id' });
    db.createObjectStore('hypotheses', { keyPath: 'id' });
    db.createObjectStore('conversations', { keyPath: 'id' });
    db.createObjectStore('reviews', { keyPath: 'id' }).createIndex('weekStart', 'weekStart');
    db.createObjectStore('nameDict', { keyPath: 'name' });
    db.createObjectStore('llmUsage', { keyPath: 'id' }).createIndex('date', 'date');
    db.createObjectStore('routineLog', { keyPath: 'id' }).createIndex('at', 'at');
  }
}
