/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "d4e5f6a7",
    "name": "knowledge_sources",
    "type": "base",
    "system": false,
    "schema": [
      { "id": "f4a00001", "name": "name", "type": "text", "required": true, "options": {} },
      { "id": "f4a00002", "name": "type", "type": "text", "required": false, "options": {} },
      { "id": "f4a00003", "name": "collection_name", "type": "text", "required": false, "options": {} },
      { "id": "f4a00004", "name": "document_count", "type": "number", "required": false, "options": {} },
      { "id": "f4a00005", "name": "last_indexed_at", "type": "date", "required": false, "options": {} }
    ]
  });
  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("knowledge_sources");
  return dao.deleteCollection(collection);
});
