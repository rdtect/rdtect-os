/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "b2c3d4e5",
    "name": "chat_messages",
    "type": "base",
    "system": false,
    "schema": [
      { "id": "f2a00001", "name": "session_id", "type": "text", "required": true, "options": {} },
      { "id": "f2a00002", "name": "role", "type": "text", "required": true, "options": {} },
      { "id": "f2a00003", "name": "content", "type": "text", "required": true, "options": {} },
      { "id": "f2a00004", "name": "tokens_used", "type": "number", "required": false, "options": {} }
    ]
  });
  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("chat_messages");
  return dao.deleteCollection(collection);
});
