/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "c3d4e5f6",
    "name": "agent_configs",
    "type": "base",
    "system": false,
    "schema": [
      { "id": "f3a00001", "name": "name", "type": "text", "required": true, "options": {} },
      { "id": "f3a00002", "name": "avatar", "type": "text", "required": false, "options": {} },
      { "id": "f3a00003", "name": "model", "type": "text", "required": true, "options": {} },
      { "id": "f3a00004", "name": "capabilities", "type": "json", "required": false, "options": {} },
      { "id": "f3a00005", "name": "system_prompt", "type": "text", "required": false, "options": {} }
    ]
  });
  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("agent_configs");
  return dao.deleteCollection(collection);
});
