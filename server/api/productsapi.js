import Shopify from "@shopify/shopify-api";
import { MongoClient } from 'mongodb';
import url from 'url';


async function productsapi(ctx, next) {

  const queryObject = url.parse( ctx.request.header.referer, true ).query;
  const SHOP = queryObject.shop;

  const mongoClient = new MongoClient( process.env.MONGODB_URI );

  try {

    await mongoClient.connect();
    const db = mongoClient.db( process.env.MONGODB_DB );
    const accessTokenDocument = await db.collection('shops').findOne({ shop: SHOP });
    const ACCESS_TOKEN = accessTokenDocument.accessToken;

    /*
    const shopifyRestClients = new Shopify.Clients.Rest( SHOP, ACCESS_TOKEN );
    let products_query = {
      path: 'products',
      query: {
        limit: 10
      }
    };
    if ( ctx.request.body.page_info ) {
      products_query.query.page_info = ctx.request.body.page_info;
    }
    const productsData = await shopifyRestClients.get(products_query);

    const link_header = productsData.headers.get('link');
    let prevPage = false;
    let nextPage = false;
    // Retrive Next and Previous START
    if ( link_header.includes( 'rel="previous"' ) ) {
      const prevLink = link_header.substring(
        link_header.indexOf("<") + 1,
        link_header.lastIndexOf('>; rel="previous"')
      );
      const prevLinkQueryObject = url.parse( prevLink, true ).query;
      prevPage = prevLinkQueryObject.page_info;
    }
    if ( link_header.includes( 'rel="next"' ) ) {
      let firstIndexOf = '<';
      if ( prevPage ) {
        firstIndexOf = 'rel="previous", <';
      }
      const nextLink = link_header.substring(
        link_header.indexOf(firstIndexOf) + 1,
        link_header.lastIndexOf('>; rel="next"')
      );
      const nextLinkQueryObject = url.parse( nextLink, true ).query;
      nextPage = nextLinkQueryObject.page_info;
    }
    // Retrive Next and Previous END
    const products = productsData.body.products;
    */


    // Graphql START
    let per_page = 25;
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
    const graphql_products = await shopifyGraphqlClient.query({
      data: `{
          products ( ${queryString} ) {
            edges {
              cursor
              node {
                legacyResourceId
                handle
                tags
                title
                bodyHtml
                createdAt
                updatedAt
                onlineStoreUrl
                onlineStorePreviewUrl
                featuredImage {
                  altText
                  height
                  originalSrc
                  src
                  width
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
    const products = graphql_products.body.data.products.edges;

    // Next Previous
    let prevPage = false;
    let nextPage = false;
    const pageInfo = graphql_products.body.data.products.pageInfo;
    if ( pageInfo.hasPreviousPage ) {
      prevPage = products[0].cursor;
    }
    if ( pageInfo.hasNextPage ) {
      nextPage = products[per_page-1].cursor;
    }

    // Graphql END


    await Promise.all(products.map(async (product, i) => {
      const product_id = product.node.legacyResourceId;

      const storeDoc = await db.collection( 'orders' ).findOne({
        cart_contents: {
          $elemMatch: {
            sourceId: product_id
          }
        }
      });

      let isordered = false;
      if (storeDoc) {
        isordered = true;
      }

      product.node.isOrderedPrevious = isordered;
    }));

    ctx.body = {
      status: 200,
      shop: SHOP,
      products: products,
      prevPage: prevPage,
      nextPage: nextPage
    };
  } catch (e) {

    console.log( 'e', e );

    ctx.body = {
      status: 200,
      data: "Something went wrong!",
    };
  } finally {
    mongoClient.close();
  }




}

module.exports = productsapi;
