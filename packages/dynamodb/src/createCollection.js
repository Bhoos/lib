import DynamoDB from 'aws-sdk/clients/dynamodb';

import createTable from './createTable';
import insert from './insert';
import findOne from './findOne';
import update from './update';
import remove from './delete';

import Key, { HASH, RANGE } from './_Key';
import Field from './_Field';

// AWS dynamodb options, set via environment variables
const options = {
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_LOCAL_PORT ? `http://localhost:${process.env.DYNAMODB_LOCAL_PORT}` : undefined,
};

// The dynamodb instance
const db = new DynamoDB(options);
const doc = new DynamoDB.DocumentClient(options);

// Schema generator, for declaring schema
const schemaGenerator = {
  key: () => new Key(),
  field: () => new Field(),
};

// Default schema, with auto generated id
const DEFAULT_SCHEMA = {
  _id: (new Key()).setAuto(),
};

export default function createCollection(name, schemaFn, procs) {
  const schema = schemaFn ? schemaFn(schemaGenerator) : DEFAULT_SCHEMA;
  const def = Object.keys(schema).reduce((res, n) => {
    switch (schema[n].keyType) {
      case HASH:
        res.pKey = n;
        break;
      case RANGE:
        res.sKey = n;
        break;
      default:
        break;
    }

    return res;
  }, {});

  def.schema = schema;

  // The generic collection object, with standard functions
  const collection = {
    createTable: createTable(db, name, def),
    insert: insert(doc, name, def),
    update: update(doc, name, def),
    delete: remove(doc, name, def),
    findOne: findOne(doc, name, def),
  };

  if (!procs) {
    return collection;
  }

  return {
    ...collection,
    ...procs({ db, doc, self: collection }),
  };
}
