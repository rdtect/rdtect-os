/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "a1b2c3d4",
    "name": "chat_sessions",
    "type": "base",
    "system": false,
    "schema": [
      { "id": "f1a00001", "name": "title", "type": "text", "required": false, "options": {} },
      { "id": "f1a00002", "name": "user_id", "type": "text", "required": false, "options": {} },
      { "id": "f1a00003", "name": "model", "type": "text", "required": true, "options": {} },
      { "id": "f1a00004", "name": "message_count", "type": "number", "required": false, "options": {} },
      { "id": "f1a00005", "name": "last_message_at", "type": "date", "required": false, "options": {} }
    ]
  });
  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("chat_sessions");
  return dao.deleteCollection(collection);
});
