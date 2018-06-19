import DynamoDB from 'aws-sdk/clients/dynamodb';

import createTable from './createTable';
import deleteTable from './deleteTable';
import updateTTL from './updateTTL';
import insert from './insert';
import findOne from './findOne';
import update from './update';
import remove from './delete';

import Key from './_Key';
import Field from './_Field';
import validateSchema from './_validateSchema';

// AWS dynamodb options, set via environment variables
const options = {
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
};

const NAME_PREFIX = process.env.DYNAMODB_STAGING || '';

// The dynamodb instance
export const db = new DynamoDB(options);
export const doc = new DynamoDB.DocumentClient(options);

// Schema generator, for declaring schema
const schemaGenerator = {
  key: name => new Key(name),
  field: name => new Field(name),
};

// Default schema, with auto generated id, similar to mongodb
const DEFAULT_SCHEMA = [
  new Key('_id').auto(),
];

export default function createCollection(name, schemaFn, procs) {
  const prefixedName = `${NAME_PREFIX}${name}`;

  const schema = schemaFn ? schemaFn(schemaGenerator) : DEFAULT_SCHEMA;

  const schemaDef = validateSchema(schema, prefixedName);

  // The generic collection object, with standard functions
  const collection = {
    createTable: createTable(db, prefixedName, schemaDef),
    deleteTable: deleteTable(db, prefixedName, schemaDef),
    updateTTL: updateTTL(db, prefixedName, schemaDef),
    insert: insert(doc, prefixedName, schemaDef),
    update: update(doc, prefixedName, schemaDef),
    delete: remove(doc, prefixedName, schemaDef),
    findOne: findOne(doc, prefixedName, schemaDef),
  };

  if (!procs) {
    return collection;
  }

  return {
    name: prefixedName,
    ...collection,
    ...procs({ db, doc, self: collection }),
  };
}
