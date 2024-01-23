import { createServer } from 'http'
import { createYoga, createPubSub } from 'graphql-yoga'
import SchemaBuilder from "@pothos/core";
import WithInputPlugin from "@pothos/plugin-with-input";
import SmartSubscriptionsPlugin, {
    subscribeOptionsFromIterator,
} from '@pothos/plugin-smart-subscriptions';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

type Cart = {
    id: string;
    items?: CartItem[];
};

const pubsub = createPubSub();

const builder = new SchemaBuilder<{
    Objects: {
        Cart: Cart;
        CartItem: CartItem;
    };
    Scalars: {
        ID: { Input: string; Output: string };
    };
}>({
    plugins: [WithInputPlugin, SmartSubscriptionsPlugin],
    smartSubscriptions: {
        ...subscribeOptionsFromIterator((name, context) => {
            return pubsub.subscribe(name);
        }),
    },
});

let CARTS = [
    { id: "1", items: [{ id: "1", name: "My item", price: 1000, quantity: 1 }] },
];

const Money = builder.objectRef<number>("Money").implement({
    fields: (t) => ({
        amount: t.int({ resolve: (amount) => amount }),
        formatted: t.string({
            resolve: (amount) =>
                new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount),
        }),
    }),
});

builder.objectType("Cart", {
    fields: (t) => ({
        id: t.exposeString("id"),
        items: t.field({
            type: ["CartItem"],
            resolve: (cart) => cart.items ?? [],
        }),
        subTotal: t.field({
            type: Money,
            resolve: (cart) =>
                cart.items?.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                ) ?? 0,
        }),
    }),
});

builder.objectType("CartItem", {
    fields: (t) => ({
        id: t.exposeString("id"),
        name: t.exposeString("name"),
        quantity: t.exposeInt("quantity"),
        price: t.exposeInt("price"),
        lineTotal: t.field({
            type: Money,
            resolve: (item) => item.price * item.quantity,
        }),
        unitTotal: t.field({
            type: Money,
            resolve: (item) => item.price,
        }),
    }),
});

builder.queryType({
    fields: (t) => ({
        cart: t.field({
            nullable: true,
            args: {
                id: t.arg.id({ required: true }),
            },
            type: "Cart",
            smartSubscription: true,
            subscribe: (subscriptions, root, args, ctx, info) =>
                void subscriptions.register('item-added'),
            resolve: (_, { id }) => {
                const cart = CARTS.find((c) => c.id === id);

                if (!cart) {
                    throw new Error(`No cart with ID: ${id}`);
                }

                return cart;
            },
        }),
    }),
});

builder.mutationType({
    fields: (t) => ({
        addItem: t.fieldWithInput({
            input: {
                cartId: t.input.id({ required: true }),
                id: t.input.id({ required: true }),
                name: t.input.string({ required: true }),
                price: t.input.int({ required: true }),
                quantity: t.input.int({ defaultValue: 1, required: true }),
            },
            type: "Cart",
            resolve: (_, { input: { cartId, ...input } }) => {
                let cart = CARTS.find((c) => c.id === cartId);

                if (!cart) {
                    throw new Error(`No cart with ID: ${cartId}`);
                }

                cart.items = [...cart?.items, input as CartItem];

                pubsub.publish('item-added', input);

                return cart
            },
        }),
    }),
});

builder.subscriptionType();

const yoga = createYoga({ schema: builder.toSchema() })

const server = createServer(yoga)
server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/graphql')
})