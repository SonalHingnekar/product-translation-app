import Shopify, { DataType } from '@shopify/shopify-api';
import { MongoClient } from 'mongodb';
const nodemailer = require("nodemailer");

import {
  get_shop_from_header,
  get_url_params_object
} from '../helper'



async function create_app_charge( ctx, next ) {

  // console.log( 'ctx', ctx );

  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );
    const accessTokenDocument = await db.collection('shops').findOne({ shop: SHOP });
    const ACCESS_TOKEN = accessTokenDocument.accessToken;

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;


    const final_return_url = process.env.HOST + '?host=' + get_url_params_object(ctx.request.header.referer).host + '&' +
                              'shop=' + get_url_params_object(ctx.request.header.referer).shop;

    const shopifyRestClient = new Shopify.Clients.Rest( SHOP, ACCESS_TOKEN );
    const total_price = ctx.request.body.total_price;
    const application_charge_response = await shopifyRestClient.post({
      path: 'application_charges',
      data: {
        "application_charge": {
          "name"        : "Test Charge",
          "price"       : total_price,
          "return_url"  : final_return_url,
          "test"        : true
        }
      },
      type: DataType.JSON,
    });
    const application_charge = application_charge_response.body.application_charge;
    const application_charge_id = application_charge_response.body.application_charge.id;

    // Insert into the order START
    const task_title            = ctx.request.body.task_title;
    const optional_instructions = ctx.request.body.optional_instructions;
    const creditAmount = ctx.request.body.creditAmount;
    const cartItems = ctx.request.body.cartItems;
    const shop_password = ctx.request.body.shopPassword;

    const isCartUpdated = await db.collection('cart').updateMany(
      { shop: storeShop },
      {
        $set: {
          price:                  total_price,
          credit:                 creditAmount,
          task_title:             task_title,
          optional_instructions:  optional_instructions,
          shop_password:          shop_password,
          cartItems:              cartItems
        }
      }
    );

    ctx.body = {
      status: 200,
      application_charge: application_charge
    };
  } catch (e) {

    console.log( 'e', e );

    ctx.body = {
      status: 200,
      data: "Something went wrong!",
    };
  } finally {
    // mongoClient.close();
  }
}


async function get_app_charge( ctx, next ) {
  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {
    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;

    ctx.body = {
      status: 200
    };
  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 200,
      data: "Something went wrong!",
    };
  } finally {

  }


}

async function insert_app_charge_data( ctx, next ) {
  const SHOP = get_shop_from_header(ctx);

  const charge_id = ctx.request.body.charge_id;

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {
    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    const stores_data = await db.collection('shops').findOne({ shop: SHOP });
    const ACCESS_TOKEN = stores_data.accessToken;
    const storeShop = stores_data.shop;
    const CREDIT_AMT = stores_data.credit !== undefined ? stores_data.credit : 0;

    const shopifyRestClient = new Shopify.Clients.Rest( SHOP, ACCESS_TOKEN );

    const application_charge_response = await shopifyRestClient.get({
      path: 'application_charges/' + charge_id,
    });

    const app_charge_data = application_charge_response.body.application_charge;

    const shop_details = await shopifyRestClient.get({
      path: 'shop',
    });

    const shop_owner = shop_details.body.shop.shop_owner;
    const shop_owner_email = shop_details.body.shop.email;

    if (app_charge_data.status == 'active') {

      // Check if charge id already is inserted START
      const is_charge_exists = await db.collection('orders').find({ application_charge_id: app_charge_data.id }).toArray();
      // Check if charge id already is inserted END

      // Get cart details START
      const cart_details = await db.collection('cart').find({ shop: storeShop }).limit(1).toArray();
      // Get cart details END

      let task_title = '';let shop_password = '';let optional_instructions = '';let price = 0;let cart_contents = [];let creditAmount = 0;
      if (cart_details[0] != 'undefined') {
        task_title = cart_details[0].task_title !== undefined ? cart_details[0].task_title : '';
        optional_instructions = cart_details[0].optional_instructions;
        shop_password = cart_details[0].shop_password;
        price = cart_details[0].price;
        creditAmount = cart_details[0].credit;
        cart_contents = cart_details[0].cartItems;
      }

      if (is_charge_exists.length === 0) {
        // Insert order data START
        const isOrderInserted = await db.collection('orders').insertOne(
          {
            shop:                   storeShop,
            task_title:             task_title,
            optional_instructions:  optional_instructions,
            shop_password:          shop_password,
            application_charge:     app_charge_data,
            application_charge_id:  app_charge_data.id,
            cart_contents:          cart_contents,
            total_price:            price,
            creditAmount:           creditAmount,
            shop_owner:             shop_owner,
            shop_owner_email:       shop_owner_email
          },
        );
        // Insert order data END

        // Insert cart contents in the product description table START
        cart_contents.map( async( product_or_collection, index ) => {

          let product_description_status = product_or_collection.isDescriptionOrdered ?  "PENDING" : "APPROVED";
          let meta_description_status = product_or_collection.isMetaDescriptionOrdered ?  "PENDING" : "APPROVED";
          let bullet_points_status = product_or_collection.contentType == 'product' && product_or_collection.areBulletPointsOrdered ? "PENDING" : "APPROVED";

          const isProductInserted = await db.collection('product_descriptions').insertOne(
            {
              orderid: isOrderInserted.insertedId,
              sourceId: product_or_collection.sourceId,
              status: "IN_PROGRESS",
              shop: storeShop,
              product_description_status: product_description_status,
              meta_description_status: meta_description_status,
              bullet_points_status: bullet_points_status,
              product_description: [{
                product_id: product_or_collection.sourceId,
                product_title: product_or_collection.title,
                product_img: product_or_collection.imageUrl,
                product_description: "",
                meta_description: "",
                bullet_points: "",
                content_type: product_or_collection.contentType,
                isDescriptionOrdered: product_or_collection.isDescriptionOrdered,
                isMetaDescriptionOrdered: product_or_collection.isMetaDescriptionOrdered,
                isBulletPointsOrdered: product_or_collection.areBulletPointsOrdered,
                wordsNumberInterval: product_or_collection.wordsNumberInterval
              }]
            }
          );
        })
        // Insert cart contents in the product description table END

        // Remove the cart START
        const remove_cart = await db.collection( 'cart' ).deleteMany({ shop: storeShop });
        // Remove the cart END

        // Remove the cart contents START
        const remove_cart_contents = await db.collection( 'cart_contents' ).deleteMany({ shop: storeShop });
        // Remove the cart contents END

        // Send mail to admin START
        var transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: "vowelweb77@gmail.com", // generated ethereal user
            pass: "mwcuvrqhqgxncwmx" // generated ethereal password
          }
        });
        transporter.sendMail({
          from: shop_owner_email,
          to: 'vowelweb77@gmail.com',
          subject: 'Message',
          text: 'I hope this message gets delivered!'
        }, (err, info) => {
          console.log(err);
          console.log(info);
        });
        // Send mail to admin END

        // Update the credit amount START
        const updatedCreditAmount = CREDIT_AMT - creditAmount;
        const isCreditUpdated = await db.collection('shops').updateOne(
          { shop: storeShop },
          {
            $set: {
              credit: updatedCreditAmount
            }
          }
        );
        // Update the credit amount END
      }

    }

    ctx.body = {
      status: 200,
      data: "Order data inserted"
    };
  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 200,
      data: "Something went wrong!",
    };
  } finally {

  }
}

module.exports = {
  create_app_charge: create_app_charge,
  get_app_charge: get_app_charge,
  insert_app_charge_data: insert_app_charge_data
};
