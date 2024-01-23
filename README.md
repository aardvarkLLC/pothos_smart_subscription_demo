# pothos subscription demo

Shows how to implement queries, mutations and subscriptions with pothos schema and yoga graphql server.

## run

```bash
npm run dev
```

Create a GraphIQL explorer window and start a subscription:

```graphql
subscription MySubscription {
  cart(id: "1") {
    id
    items {
      id
      name
      price
      quantity
    }
    subTotal {
      amount
    }
  }
}
```

Create another GraphIQL explorer window and run a mutation. The subscription window should update to show the newly-created item in the cart.

```graphql
mutation MyMutation {
  addItem(input: {cartId: "1", name: "gazzew", price: 6, quantity: 6, id: "5"}) {
    id
    items {
      id
      name
    }
  }
}
```
