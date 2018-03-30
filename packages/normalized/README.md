# normalized redux utility
Data on redux state should be normalized to avoid unwanted
data changes on an entire array when the change requested
is in a single node. The schema records are stored with
`allIds` array and `byId` structure. The data extraction
and manipulation becomes quite verbose and tedious after
these changes. 

The normalized library provides a set of api to work on
this normalized state.

## create(items: Array, [initialValue])
Create a new normalized data structure from the given
items and an optional initialValue to initialize each
record with. 
```javascript
{
  books: create([...], { available: false });
}
```

## concat(state, item)
Add the given item to the state tree
```javascript
// Ex: Add a new book
{
  books: concat(store.getState().books, { 
    id: 'b1', 
    title: 'Normalization', 
    isbn: '1234'
  }),
}
```

## update(state, id, updateFn)
Update a single item using the update function provided
```javascript
// Ex: Update price of a single book with id 'b1'
{
  books: update(store.getState().books, 'b1', book => ({
    ...book, 
    price: book.price  10 
  }),
}
```

## map(state, fn)
Array map equivalent with (item, index, allIds) parameters
```javascript
// Ex: Get the isbn of all books
const isbns = map(store.getState().books, book => book.isbn);
```

## count(state, fn)
A count method for counting truthy via function passed.

```javascript
// Ex: Get the number of books of type novel
const totalNovels = count(store.getState().books, book => book.type === 'novel');
```