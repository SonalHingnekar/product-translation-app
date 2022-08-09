import url from 'url';

function get_url_params_object( the_url ) {
  const queryObject = url.parse( the_url, true ).query;
  return queryObject;
}

function get_shop_from_header( ctx ) {
  const queryObject = url.parse( ctx.request.header.referer, true ).query;
  return queryObject.shop;
}



function get_shop_id() {
}

module.exports = {
  get_url_params_object: get_url_params_object,
  get_shop_from_header: get_shop_from_header
};
