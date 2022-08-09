import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";

import mongoose from "mongoose";
import { webhooks } from "./webhooks/index.js";
const sessionStorage = require("./utils/sessionStorage.js");
const SessionModel = require("./models/SessionModel.js");
const ShopModel = require("./models/ShopModel.js");

import Cryptr from "cryptr";
const cryption = new Cryptr(process.env.ENCRYPTION_STRING);

import bodyParser from 'koa-bodyparser';
import { MongoClient } from 'mongodb';


// API Routes
import get_product_list from "./api/productsapi";
import get_collection_list from "./api/collectionApi";
import { create_app_credit, get_application_credit } from "./api/ApplicationCredit";
import { add_cart_contents, get_cart_contents, update_cart_contents, remove_cart_contents, get_pricing_contents, get_cart_count } from "./api/cartapi";
import { create_app_charge, insert_app_charge_data } from "./api/ApplicationCharge";
import { get_product_description_orders, update_product_description, update_product_status, update_product_meta_status } from "./api/OrderedDescription";
// API Routes END


// MongoDB Connection START
const mongoUrl = process.env.MONGODB_URI;
mongoose.connect(
  mongoUrl,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log("--> There was an error connecting to MongoDB:", err.message);
    } else {
      console.log("--> Connected to MongoDB");
    }
  }
);
// MongoDB Connection END



dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  // SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),

  SESSION_STORAGE: sessionStorage,
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  server.use(bodyParser());
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];

  let useOfflineAccessToken = true;

  if ( useOfflineAccessToken ) {
    server.use(
      createShopifyAuth({
        accessMode: "offline",
        // prefix: "/install",
        async afterAuth(ctx) {
          const { shop, accessToken, scope } = ctx.state.shopify;
          const host = ctx.query.host;

          const result = await ShopModel.findOne({ shop: shop });
          //console.log( 'result', result );

          if (!result) {

            await ShopModel.create({
              shop: shop,
              accessToken: accessToken,
              scope: scope,
              credit: 5,
            }).then(() => {
              // create_app_credit(ctx, shop, accessToken)
              ctx.redirect(`/auth?shop=${shop}&host=${host}`)
            });
          } else {
            ctx.redirect(`/auth?shop=${shop}&host=${host}`);
          }
        },
      })
    );
  }
  // else {
  //   server.use(
  //     createShopifyAuth({
  //       async afterAuth(ctx) {
  //         // Access token and shop available in ctx.state.shopify
  //         const { shop, accessToken, scope } = ctx.state.shopify;
  //         const host = ctx.query.host;
  //
  //         for (const webhook of webhooks) {
  //           const response = await Shopify.Webhooks.Registry.register({
  //             shop,
  //             accessToken,
  //             path: webhook.path,
  //             topic: webhook.topic,
  //             webhookHandler: webhook.webhookHandler,
  //           });
  //
  //           if (!response.success) {
  //             console.log(
  //               `Failed to register ${webhook.topic} webhook: ${response.result}`
  //             );
  //           } else {
  //             console.log(`Successfully registered ${webhook.topic} webhook.`);
  //           }
  //         }
  //
  //         // Redirect to app with shop parameter upon auth
  //         ctx.redirect(`/?shop=${shop}&host=${host}`);
  //       },
  //     })
  //   );
  // }



  // server.use(
  //   createShopifyAuth({
  //     async afterAuth(ctx) {
  //       // Access token and shop available in ctx.state.shopify
  //       const { shop, accessToken, scope } = ctx.state.shopify;
  //       const host = ctx.query.host;
  //       ACTIVE_SHOPIFY_SHOPS[shop] = scope;
  //
  //       // Custom Code START
  //       insertAccessToken( shop, accessToken );
  //       // Custom Code END
  //
  //       const response = await Shopify.Webhooks.Registry.register({
  //         shop,
  //         accessToken,
  //         path: "/webhooks",
  //         topic: "APP_UNINSTALLED",
  //         webhookHandler: async (topic, shop, body) =>
  //           delete ACTIVE_SHOPIFY_SHOPS[shop],
  //       });
  //
  //       if (!response.success) {
  //         console.log(
  //           `Failed to register APP_UNINSTALLED webhook: ${response.result}`
  //         );
  //       }
  //
  //       // Redirect to app with shop parameter upon auth
  //       ctx.redirect(`/?shop=${shop}&host=${host}`);
  //     },
  //   })
  // );


  const insertAccessToken = (shop, accessToken) => {
    MongoClient.connect( process.env.MONGODB_URI, function(err, db) {
      if (err) throw err;
      var dbo = db.db( process.env.MONGODB_DB );

      const query = { shop: shop };
      const update = { $set: { accessToken: accessToken } };
      const options = { upsert: true };
      dbo.collection('stores').updateOne( query, update, options );
      // db.close();
    });
  };


  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    ctx.res.setHeader(
      "Content-Security-Policy",
      `frame-ancestors https://${shop} https://admin.shopify.com;`
    );

    // This shop hasn't been seen yet, go through OAuth to create a session
    // if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
    //   ctx.redirect(`/auth?shop=${shop}`);
    // } else {
    //   await handleRequest(ctx);
    // }

    if (useOfflineAccessToken) {
      const isInstalled = await ShopModel.countDocuments({ shop });
      if (isInstalled == 0) {
        ctx.redirect(`/auth?shop=${shop}`);
      } else {
        await handleRequest(ctx);
      }
    }
    // console.log( 'shop outside', ctx );
    // if ( useOfflineAccessToken ) {
    //   const isInstalled = await ShopModel.countDocuments({ shop });
    //
    //   console.log( 'shop', shop );
    //   console.log( 'isInstalled', isInstalled );
    //
    //   if (isInstalled === 0) {
    //     ctx.redirect(`/auth?shop=${shop}`);
    //   } else {
    //     const findShopCount = await SessionModel.countDocuments({ shop });
    //
    //     if (findShopCount < 2) {
    //       await SessionModel.deleteMany({ shop });
    //       ctx.redirect(`/auth?shop=${shop}`);
    //     } else {
    //       await handleRequest(ctx);
    //     }
    //   }
    // } else {
    //   const findShopCount = await SessionModel.countDocuments({ shop });
    //   if (findShopCount < 2) {
    //     await SessionModel.deleteMany({ shop });
    //     ctx.redirect(`/auth?shop=${shop}`);
    //   } else {
    //     await handleRequest(ctx);
    //   }
    // }

  });


  // APIs
  router.post( "/get_product_list", get_product_list );
  router.post( "/get_collection_list", get_collection_list );
  router.post( "/get_application_credit", get_application_credit );
  router.post( "/add_cart_contents", add_cart_contents );
  router.post( '/get_cart_contents', get_cart_contents );
  router.post( '/update_cart_contents', update_cart_contents );
  router.post( '/remove_cart_contents', remove_cart_contents );
  router.post( '/get_pricing_contents', get_pricing_contents );
  router.post( '/get_cart_count', get_cart_count );
  router.post( '/create_app_charge', create_app_charge );
  router.post( '/insert_app_charge_data', insert_app_charge_data );
  router.post( '/get_product_description_orders', get_product_description_orders );
  router.post( '/update_product_description', update_product_description );
  router.post( '/update_product_status', update_product_status );
  router.post( '/update_product_meta_status', update_product_meta_status );
  // APIs END


  server.use(router.allowedMethods());
  server.use(router.routes());

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
