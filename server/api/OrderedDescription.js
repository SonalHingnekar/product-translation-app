import Shopify, { DataType } from "@shopify/shopify-api";
import { MongoClient, ObjectID } from 'mongodb';
const nodemailer = require("nodemailer");

import { get_shop_from_header } from '../helper'

async function get_product_description_orders( ctx, next ) {

  const SHOP = get_shop_from_header(ctx);
  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;

    const status = ctx.request.body.status;
    const isUpdatedStatus = ctx.request.body.isUpdatedStatus;

    if (status !== '') {
      var matchQuery = {
        $match: {
          shop: storeShop,
          status: status
        }
      };
    } else {
      var matchQuery = {
        $match: {
          shop: storeShop,
          $or: [{ product_description_status: isUpdatedStatus }, { meta_description_status: isUpdatedStatus }, { bullet_points_status: isUpdatedStatus }]
        }
      };
    }

    let pageNumber = ctx.request.body.pageNumber
      ? ctx.request.body.pageNumber
      : 1;
    let nPerPage = 10;


    const completed_orders_count = await db
      .collection("product_descriptions")
      .aggregate([
        matchQuery,
        {
          $lookup: {
            from:         "orders",
            localField:   "orderid",
            foreignField: "_id",
            as:           "order_details",
          },
        },
        {
          $count: "count",
        },
      ])
      .toArray();
    let total_count = 0;

    if (typeof completed_orders_count[0] != "undefined") {
      total_count = completed_orders_count[0].count;
    }

    const completed_orders = await db
      .collection("product_descriptions")
      .aggregate([
        matchQuery,
        {
          $lookup: {
            from:         "orders",
            localField:   "orderid",
            foreignField: "_id",
            as:           "order_details",
          },
        }
      ])
      .skip(pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0)
      .limit(nPerPage)
      .toArray();

    const numPages = Math.ceil(total_count / nPerPage);
    let prevPage = pageNumber == 1 ? false : pageNumber - 1;
    let nextPage = pageNumber < numPages ? pageNumber + 1 : false;

    ctx.body = {
      status: 200,
      msg: "Product description ordered data.",
      prevPage: prevPage,
      nextPage: nextPage,
      pendingOrder: completed_orders,
      total_count: total_count
    }

  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 100,
      msg: "Something went wrong!",
    }
  } finally {

  }

}

async function update_product_meta_status( ctx, next ) {
  const SHOP = get_shop_from_header(ctx);
  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;
    const accessToken = storeDoc.accessToken;

    const body_data = ctx.request.body;

    const isProductDescriptionUpdated = await db.collection('product_descriptions').updateOne(
      { shop: storeShop, _id: new ObjectID( body_data.orderId ) },
      {
        $set: {
          meta_description_status: "APPROVED"
        }
      }
    );

    ctx.body = {
      status: 200,
      msg:  isProductDescriptionUpdated,
    }

  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 100,
      msg: "Something went wrong!",
    }
  } finally {

  }
}

async function update_product_description( ctx, next ) {

  const SHOP = get_shop_from_header(ctx);
  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;
    const accessToken = storeDoc.accessToken;

    const body_data = ctx.request.body;

    let contentType = "";let body_html = "";

    let updateKey = "bullet_points_status";
    if ( body_data.task == "meta-description" ) {
      updateKey = "meta_description_status";
    } else if (  body_data.task == "description" ) {
      updateKey = "product_description_status";
    }


    const isProductDescriptionUpdated = await db.collection('product_descriptions').updateOne(
      { shop: storeShop, _id: new ObjectID( body_data.orderId ) },
      {
        $set: {
          [updateKey]: "APPROVED"
        }
      }
    );

    let updated_row = {};
    const updated_row_arr = await db
      .collection("product_descriptions")
      .aggregate([
        {
          $match: {
            _id: new ObjectID( body_data.orderId ),
            shop: storeShop,
            status: "APPROVED",
          }
        },
        {
          $lookup: {
            from:         "orders",
            localField:   "orderid",
            foreignField: "_id",
            as:           "order_details",
          },
        }
      ])
      .limit(1)
      .toArray();
    if (updated_row_arr && updated_row_arr.length) {
      updated_row = updated_row_arr[0];
    }


    if (body_data.contentType == 'product') {

      const client = new Shopify.Clients.Rest(storeShop, accessToken);
      const product = await client.get({
        path: 'products/' + body_data.product_id,
      });

      if ( body_data.action == 'Add' ) {
        body_html += product.body.product.body_html;
        body_html += body_data.contentHtml;
      }else{
        body_html += body_data.contentHtml;
      }

      let update_key = "body_html";
      if (body_data.task == "meta-description") {
        update_key = "metafields_global_description_tag";
      }

      const isUpdated = await client.put({
        path: 'products/' + body_data.product_id,
        data: {
          "product":{
            "id": body_data.product_id,
            [update_key]: body_html
          }
        },
        type: DataType.JSON,
      });

      contentType = 'Product';

    } else if (body_data.contentType == 'collection') {

      const client = new Shopify.Clients.Rest(storeShop, accessToken);
      const collection = await client.get({
        path: 'collections/' + body_data.product_id,
      });

      const collection_type = collection.body.collection.collection_type;
      const collection_body_html_old = collection.body.collection.body_html;

      if ( body_data.action == 'Add' ) {
        body_html += collection_body_html_old;
        body_html += body_data.contentHtml;
      }else{
        body_html += body_data.contentHtml;
      }

      if ( collection_type == 'custom' ) {

        const isUpdated = await client.put({
          path: 'custom_collections/' + body_data.product_id,
          data: {
            "custom_collection":{
              "id": body_data.product_id,
              "body_html": body_html
            }
          },
          type: DataType.JSON,
        });
      } else if ( collection_type == 'smart' ) {
        const isUpdated = await client.put({
          path: 'smart_collections/' + body_data.product_id,
          data: {
            "smart_collection":{
              "id": body_data.product_id,
              "body_html": body_html
            }
          },
          type: DataType.JSON,
        });
      }

      contentType = 'Collection';
    }

    ctx.body = {
      status: 200,
      data: body_html,
      msg: contentType + " Updated!",
      updated_row: updated_row
    }

  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 100,
      msg: "Something went wrong!",
    }
  } finally {

  }
}

async function update_product_status( ctx, next ) {

  const SHOP = get_shop_from_header(ctx);
  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );

    // Find the store ID
    const storeDoc = await db.collection( 'shops' ).findOne({ shop: SHOP });
    const storeShop = storeDoc.shop;
    const accessToken = storeDoc.accessToken;

    const client = new Shopify.Clients.Rest(storeShop, accessToken);
    const shop_details = await client.get({
      path: 'shop',
    });

    const shop_owner_email = shop_details.body.shop.email;

    const body_data = ctx.request.body;

    const isProductDescriptionUpdated = await db.collection('product_descriptions').updateOne(
      { shop: storeShop, sourceId: body_data.sourceId },
      {
        $set: {
          status:             body_data.status,
          note:               body_data.note
        }
      },
      { upsert: true }
    );

    let statusMsg = "Product approved.";
    if (body_data.status == "IN_REVIEW") {
      statusMsg = "Request for revision sent.";
    }

    var transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "vowelweb77@gmail.com", // generated ethereal user
        pass: "zfqrwdxkbiowupye" // generated ethereal password
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

    ctx.body = {
      status: 200,
      msg: statusMsg,
    }
  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 100,
      msg: "Something went wrong!",
    }
  } finally {

  }
}

module.exports = {
  get_product_description_orders: get_product_description_orders,
  update_product_description: update_product_description,
  update_product_status: update_product_status,
  update_product_meta_status: update_product_meta_status,
};
