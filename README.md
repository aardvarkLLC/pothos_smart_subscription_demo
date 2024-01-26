# pothos smart subscription plugin demo

Shows how to implement queries, mutations and subscriptions with pothos smart subscription plugin and yoga graphql server.
It does not work with Cloudflare workerd because it uses setTimeout() such that the callback may be invoked outside the Request context. Not easy to fix IMHO.

If setTimeout() is polyfilled such that a 0 debounceDelay is ignored, then another problem surfaces: a mutation request may trigger a subscription response within the context of the request. Cloudflare's workerd implementation does not allow I/O to cross request boundaries.

Submitted an [enhancement issue](https://github.com/hayes/pothos/issues/1141).

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
