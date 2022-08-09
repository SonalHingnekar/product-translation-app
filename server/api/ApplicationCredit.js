import Shopify, { DataType } from '@shopify/shopify-api';
import { MongoClient } from 'mongodb';
import url from 'url';

import { get_shop_from_header,  get_url_params_object } from '../helper';

async function create_app_credit( ctx, shop, accessToken ) {

  const mongoClient = new MongoClient( process.env.MONGODB_URI );
  const SHOP = shop;

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );
    const ACCESS_TOKEN = accessToken;

    const shopifyRestClient = new Shopify.Clients.Rest( SHOP, ACCESS_TOKEN );
    const application_credit_response = await shopifyRestClient.post({
      path: 'application_credits',
      data: {
        "application_credit" : {
          "description" : "application credit for product description writing",
          "amount" : 5.0,
          "test" : true
        }
      },
      type: DataType.JSON,
    });

    const application_credit = application_credit_response.body.application_credit;

    const isShopUpdated = await db.collection('shops').updateOne(
      { shop: SHOP },
      {
        $set: {
          credit_id:  application_credit.id
        }
      }
    );

    ctx.body = {
      status: 200,
      data: "Application charge created."
    };

  } catch (e) {

    console.log('error', e);

    ctx.body = {
      status: 100,
      data: "Something went wrong!",
    };
  } finally {

  }

  const client = new Shopify.Clients.Rest('your-development-store.myshopify.com', accessToken);
  ctx.body = {
    status: 100,
    data: "Something went wrong!",
  };
}

async function get_application_credit( ctx, next ) {

  const queryObject = url.parse( ctx.request.header.referer, true ).query;
  const SHOP = queryObject.shop;

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );
    const shops = await db.collection('shops').findOne({ shop: SHOP });
    const ACCESS_TOKEN = shops.accessToken;
    const CREDIT_AMT = shops.credit !== undefined ? shops.credit : 0;

    ctx.body = {
      status: 200,
      creditAmount: CREDIT_AMT,
      data: "Application credit amount.",
    };

  } catch (e) {

    console.log('error', e);

    ctx.body = {
      status: 100,
      data: "Something went wrong!",
    };
  } finally {

  }
}

module.exports = {
  create_app_credit: create_app_credit,
  get_application_credit:get_application_credit
};
