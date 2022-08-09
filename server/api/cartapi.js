import Shopify from "@shopify/shopify-api";
import { MongoClient, ObjectID } from 'mongodb';

import {
  get_shop_from_header
} from '../helper'

async function add_cart_contents( ctx, next ) {
  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;


    // Update Or Insert into the cart START
    const isCartExists = await db.collection('cart').findOne(
      { shop: storeShop },
    );
    let cart_id = null;
    if (isCartExists) {
      // Get the ID
      cart_id = new ObjectID(isCartExists._id);
    } else {
      // Insert
      const isInsertedCart = await db.collection('cart').insertOne(
        { shop: storeShop, price: 0, credit: 0,task_title: '', optional_instructions: '' }
      );
      cart_id = new ObjectID( isInsertedCart.insertedId );
    }
    // Update Or Insert into the cart END

    const ctx_request_body_product  = ctx.request.body.product;
    const contentType               = ctx.request.body.contentType;
    const product_handle               = ctx.request.body.product_handle;

    if (contentType == 'collection') {
      var imageUrl = ctx_request_body_product.image !== null ? ctx_request_body_product.image.src : '';
      var bodyHtml = ctx_request_body_product.descriptionHtml;
      var adminUrl = 'https://'+storeShop+'/admin/collections/'+ctx_request_body_product.legacyResourceId;
      var previewUrl = 'https://'+storeShop+'/collections/'+product_handle;
    }else{
      var imageUrl = ctx_request_body_product.featuredImage.src !== undefined ? ctx_request_body_product.featuredImage.src : '';
      var bodyHtml = ctx_request_body_product.bodyHtml;
      var adminUrl = 'https://'+storeShop+'/admin/products/'+ctx_request_body_product.legacyResourceId;
      var previewUrl = 'https://'+storeShop+'/products/'+product_handle;
    }

    // Check if the cart content is available
    const isCartContentExist = await db.collection('cart_contents').updateOne(
      { shop: storeShop, sourceId: ctx_request_body_product.legacyResourceId },
      {
        $set: {
          shop:                     storeShop,
          cartId:                   cart_id,
          contentType:              contentType,
          isDescriptionOrdered:     true,
          isMetaDescriptionOrdered: false,
          areBulletPointsOrdered:   false,
          wordsNumberInterval:      '100',
          optionalInstructions:     '',
          price:                    '',
          sourceId:                 ctx_request_body_product.legacyResourceId,
          title:                    ctx_request_body_product.title,
          imageUrl:                 imageUrl,
          bodyHtml:                 bodyHtml,
          previewUrl:               previewUrl,
          adminUrl:                 adminUrl
        }
      },
      { upsert: true }
    );

    const cart_with_contents = await db
      .collection("cart")
      .aggregate([
        {
          $lookup: {
            from:         "cart_contents",
            localField:   "cartId",
            foreignField: "_id",
            as:           "cart_contents",
          },
        }
      ])
      .toArray();

    ctx.body = {
      status: 200,
      cart: []
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

async function get_cart_contents( ctx, next ) {
  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {
    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;

    const cart_contents = await db.collection('cart').find({ shop: storeShop }).limit(0).toArray();

    const cart_with_contents = await db
      .collection("cart")
      .aggregate([
        {
          $lookup: {
            from:         "cart_contents",
            localField:   "_id",
            foreignField: "cartId",
            as:           "cart_contents",
          },
        }
      ])
      .toArray();

    let cart_obj = {};
    if ( cart_with_contents[0] != 'undefined' ) {
      cart_obj = cart_with_contents[0];
    }

    ctx.body = {
      status: 200,
      cart: cart_obj
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

async function remove_cart_contents( ctx, next ) {

  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {
    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;

    // Do Operation On the cart
    const ctx_request_body_product_sourceId = ctx.request.body.sourceId;
    // let cart_contents = [];
    if ( ctx_request_body_product_sourceId == -1 ) {
      // Delete All
      const deleteMany = await db.collection('cart_contents').deleteMany( { shop: storeShop } );
    } else if ( ctx_request_body_product_sourceId.constructor === Array ) {
      // Selective Delete
      const deleteSelective = await db.collection('cart_contents').deleteMany( { shop: storeShop, sourceId: { '$in': ctx_request_body_product_sourceId } } );
      // cart_contents = await db.collection('cart_contents').find({ shop: storeShop }).limit(0).toArray();
    } else {
      // Delete One
      const deleteOne = await db.collection('cart_contents').deleteOne( { shop: storeShop, sourceId: ctx_request_body_product_sourceId } );
      // cart_contents = await db.collection('cart_contents').find({ shop: storeShop }).limit(0).toArray();
    }
    //

    const cart_with_contents = await db
      .collection("cart")
      .aggregate([
        {
          $lookup: {
            from:         "cart_contents",
            localField:   "_id",
            foreignField: "cartId",
            as:           "cart_contents",
          },
        }
      ])
      .toArray();

    let cart_obj = {};
    if ( cart_with_contents[0] != 'undefined' ) {
      cart_obj = cart_with_contents[0];
    }

    ctx.body = {
      status: 200,
      cart:   cart_obj
    };
  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 200,
      cart: "Something went wrong!",
    };
  } finally {

  }

}

async function update_cart_contents( ctx, next ) {

  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  await mongoClient.connect();
  const db = mongoClient.db( process.env.MONGODB_DB );

  // Find the store ID
  const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
  const storeShop = storeDoc.shop;

  const ctx_request_body_tasks = ctx.request.body.tasks;


  // Update Or Insert into the cart
  const isUpdatedMany = await db.collection( 'cart' ).updateMany(
    { shop: storeShop },
    { $set: {  tasks: ctx_request_body_tasks } },
  );

  const cart_contents = await db.collection('cart').find({ shop: storeShop }).limit(0).toArray();

  try {
    ctx.body = {
      status: 200,
      cart: cart_contents
    };
  } catch (e) {
    ctx.body = {
      status: 200,
      data: "Something went wrong!",
    };
  } finally {

  }

}

async function get_pricing_contents( ctx, next ) {

  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  await mongoClient.connect();
  const db = mongoClient.db( process.env.MONGODB_DB );

  try {

    const pricing_contents = await db.collection('pricing').find().toArray();

    ctx.body = {
      status: 200,
      data: pricing_contents
    };
  } catch (e) {
    ctx.body = {
      status: 100,
      data: "Something went wrong!",
    };
  } finally {

  }
}

async function get_cart_count( ctx, next ) {
  const SHOP = get_shop_from_header(ctx);

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  await mongoClient.connect();
  const db = mongoClient.db( process.env.MONGODB_DB );

  try {

    const get_cart_count = await db.collection('cart_contents').aggregate([
      {
        $group: {
          _id: '$contentType',
          count: { $sum:  1 }
        }
      }
    ]).toArray();

    ctx.body = {
      status: 200,
      data: get_cart_count
    };
  } catch (e) {
    ctx.body = {
      status: 100,
      data: "Something went wrong!",
    };
  } finally {

  }
}

module.exports = {
  add_cart_contents: add_cart_contents,
  get_cart_contents: get_cart_contents,
  get_cart_count: get_cart_count,
  update_cart_contents: update_cart_contents,
  remove_cart_contents: remove_cart_contents,
  get_pricing_contents: get_pricing_contents
};
