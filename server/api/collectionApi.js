import Shopify from "@shopify/shopify-api";
import { MongoClient } from 'mongodb';
import url from 'url';

async function collectionApi(ctx, next) {

  const queryObject = url.parse( ctx.request.header.referer, true ).query;
  const SHOP = queryObject.shop;

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try{

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );
    const accessTokenDocument = await db.collection('shops').findOne({ shop: SHOP });
    const ACCESS_TOKEN = accessTokenDocument.accessToken;

    // Graphql START
    let per_page = 5;
    let searchQuery = "";
    if ( ctx.request.body.hasOwnProperty( 'queryValue' ) && ctx.request.body.queryValue ) {
      searchQuery = `, query: "${ctx.request.body.queryValue}"`;
    }

    // Prev Or Next START
    let prev_or_next_query = "";
    if (
      ctx.request.body.prev_or_next == "before" &&
      ctx.request.body.page_info
    ) {
      prev_or_next_query = `, before: "${ctx.request.body.page_info}"`;
    }
    if (
      ctx.request.body.prev_or_next == "after" &&
      ctx.request.body.page_info
    ) {
      prev_or_next_query = `, after: "${ctx.request.body.page_info}"`;
    }
    // Prev Or Next END

    let queryString = "";
    if (ctx.request.body.prev_or_next == "before") {
      queryString = `last: ${per_page}` + searchQuery + prev_or_next_query + `, sortKey: TITLE`;
    } else if (ctx.request.body.prev_or_next == "after") {
      queryString = `first: ${per_page}` + searchQuery + prev_or_next_query + `, sortKey: TITLE`;
    } else {
      queryString = `first: ${per_page}` + searchQuery + `, sortKey: TITLE`;
    }

    const shopifyGraphqlClient = new Shopify.Clients.Graphql(
      SHOP,
      ACCESS_TOKEN
    );

    const graphql_collections = await shopifyGraphqlClient.query({
      data: `{
          collections ( ${queryString} ) {
            edges {
              cursor
              node {
                legacyResourceId
                handle
                title
                descriptionHtml
                updatedAt
                image {
                  src
                  altText
                  height
                  width
                  originalSrc
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
        }`,
    });
    const collections = graphql_collections.body.data.collections.edges;

    // Next Previous
    let prevPage = false;
    let nextPage = false;
    const pageInfo = graphql_collections.body.data.collections.pageInfo;
    if ( pageInfo.hasPreviousPage ) {
      prevPage = collections[0].cursor;
    }
    if ( pageInfo.hasNextPage ) {
      nextPage = collections[per_page-1].cursor;
    }

    // Graphql END

    await Promise.all(collections.map(async (collection, i) => {
      const collection_id = collection.node.legacyResourceId;

      const storeDoc = await db.collection( 'orders' ).findOne({
        cart_contents: {
          $elemMatch: {
            sourceId: collection_id
          }
        }
      });

      let isordered = false;
      if (storeDoc) {
        isordered = true;
      }

      collection.node.isOrderedPrevious = isordered;
    }));

    ctx.body = {
      status: 200,
      collections: collections,
      shop: SHOP,
      prevPage: prevPage,
      nextPage: nextPage
    };

  } catch (e) {
    console.log( 'e', e );

    ctx.body = {
      status: 100,
      data: "Something went wrong!",
    };
  } finally {
    mongoClient.close();
  }
}

module.exports = collectionApi;
