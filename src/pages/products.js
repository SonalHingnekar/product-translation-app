import {
  useState,
  useCallback,
  useEffect
} from "react";

import profilePic from '../../public/img-dummy-product.jpg';

import {
  Heading,
  Page,
  Layout,
  Frame,
  Navigation,
  Card,
  FormLayout,
  TextField,
  IndexTable,
  EmptySearchResult,
  TextStyle,
  Filters,
  Loading,
  SkeletonPage,
  TextContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  Button,
  Checkbox,
  Pagination,
  Toast,
  Thumbnail,
  Scrollable,
  Link,
  useIndexResourceState
} from "@shopify/polaris";

import {
  HomeMajor,
  NoteMajor,
  ProductsMajor,
  CartMajor,
  ViewMajor,
  TickMinor
} from '@shopify/polaris-icons';

const ProductsIndexTable = (props) => {

  const [productsArr, setProducts] = useState([])
  const [isLoading, setLoading] = useState(false)

  const [nextPage, setNextPage] = useState(false)
  const [prevPage, setPrevPage] = useState(false)
  const [toastActive, setToastActive] = useState(false);
  const [loaderAddToCart, setLoaderAddToCart] = useState(false);
  const [isActive, setIsActive] = useState(0);
  const [resHeading, setResHeading] = useState('');
  const [resImage, setResImage] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resPreviewUrl, setResPreviewUrl] = useState('');
  const [resEditUrl, setResEditUrl] = useState('');
  const [shop, setShop] = useState('');

  const toggleToastActive = useCallback((active) => { setToastActive(false) }, []);

  const get_product_list = ( page_info = false, prev_or_next = false ) => {
    setLoading( true );
    fetch(
      '/get_product_list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queryValue: queryValue,
          taggedWith: taggedWith,
          prev_or_next: prev_or_next,
          page_info: page_info,
        })
      }
    ).then(
      (res) => res.json()
    ).then((data) => {

      // console.log( 'data', data );

      if ( data.hasOwnProperty( 'prevPage' ) ) {
        setPrevPage( data.prevPage );
      }

      if ( data.hasOwnProperty( 'nextPage' ) ) {
        setNextPage( data.nextPage );
      }

      if (data.products.length) {

        const productNode = data.products[0].node;
        const host = 'https://' + data.shop;
        const previewUrl = host+'/products/'+productNode.handle
        const editUrl = host+'/admin/products/'+productNode.legacyResourceId
        const featuredImage = productNode.featuredImage !== null ? productNode.featuredImage.src : '';

        setShop(data.shop);
        setResHeading(productNode.title);
        setResImage(featuredImage);
        setResDescription(productNode.bodyHtml);
        setResPreviewUrl(previewUrl);
        setResEditUrl(editUrl);
      }

      setProducts( data.products );
      setLoading( false );
    })
  };

  useEffect(() => {

    get_product_list();

  }, [queryValue])

  const get_cart_count = () => {
    fetch(
      '/get_cart_count',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    ).then((res) => res.json()).then((response) => {
      if (response.status == 200) {
        if (response.data.length) {
          const getTotalCount = response.data.reduce((total, obj) => obj.count + total,0);

          props.setTotalCartCount(getTotalCount);
        }
      }
    })
  }

  function disambiguateLabel(key, value) {
    switch (key) {
      case 'taggedWith':
        return `Tagged with ${value}`;
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === '' || value == null;
    }
  }

  const resourceIDResolver = (productsArr) => {
    return productsArr.node.legacyResourceId;
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(productsArr, {
    resourceIDResolver,
  });

  const [taggedWith, setTaggedWith] = useState(null);
  const [queryValue, setQueryValue] = useState(null);

  const handleTaggedWithChange = useCallback(
    (value) => setTaggedWith(value),
    [],
  );
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(null), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(null), []);
  const handleClearAll = useCallback(() => {
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [handleQueryValueRemove, handleTaggedWithRemove]);


  const filters = [
    {
      key: 'taggedWith',
      label: 'Tagged with',
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
  ];


  const appliedFilters = !isEmpty(taggedWith)
    ? [
        {
          key: 'taggedWith',
          label: disambiguateLabel('taggedWith', taggedWith),
          onRemove: handleTaggedWithRemove,
        },
      ]
    : [];

  const promotedBulkActions = [
    {
      content: 'Add To Cart',
      onAction: () => {

        setLoaderAddToCart(true)
        // Multiple product add to cart START
        selectedResources.map((legacyResourceId, index)=>{

          var product_obj_by_id = productsArr.find(obj => {
            return obj.node.legacyResourceId === legacyResourceId
          })

          fetch(
            '/add_cart_contents',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contentType: 'product',
                product_handle: product_obj_by_id.node.handle,
                product: product_obj_by_id.node,
              })
            }
          ).then(
            (res) => res.json()
          ).then((data) => {
            // console.log( 'data', data );
            if (index == (selectedResources.length - 1)) {
              get_cart_count();
              setToastActive(true)
              setLoaderAddToCart(false)
            }
          })

        })
        // Multiple product add to cart END

        // console.log(
        //   'selectedResources',
        //   selectedResources
        // );
      }
    },
  ];

  const redirectDashboard = () => {
    props.setPage('/');
  }

  const handleAddToCart = ( productObj, index ) => {

    const host = 'https://' + shop;
    const previewUrl = host+'/products/'+productObj.handle
    const editUrl = host+'/admin/products/'+productObj.legacyResourceId
    const featuredImage = productObj.featuredImage !== null ? productObj.featuredImage.src : '';

    setIsActive(index);
    setResHeading(productObj.title);
    setResImage(featuredImage);
    setResDescription(productObj.bodyHtml);
    setResPreviewUrl(previewUrl);
    setResEditUrl(editUrl);
  }

  const [productsSelectedOptions, setProductsSelectedOptions] = useState({});

  const toastMarkup = toastActive ? (
    <Toast content="Product added to cart" onDismiss={toggleToastActive} />
  ) : null;

  const rowMarkup = productsArr.map(
    ( { node }, index) => (
      <IndexTable.Row
        id={node.legacyResourceId}
        key={node.legacyResourceId}
        selected={ selectedResources.includes(node.legacyResourceId) }
        position={index}
      >
        <IndexTable.Cell>
          <Thumbnail
            source={node.featuredImage !== null ? node.featuredImage.src : ''}
            size="medium"
            alt={node.title}
          />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <TextStyle variation="strong">{node.title}</TextStyle>
        </IndexTable.Cell>
        <IndexTable.Cell>
          { !!node.isOrderedPrevious && <Button onClick={ () => { redirectDashboard() }} icon={TickMinor} plain={true}></Button>}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Button onClick={ () => { handleAddToCart( productsArr[index].node, index ) }} id={ (isActive == index) ? 'previewActive' : '' } icon={ViewMajor} plain={true}></Button>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const imageUrlHtml = resImage !== "" ? (
    <img src={resImage} width="150" height="150" alt={resHeading}/>
  ) : (
    <img src={profilePic.src} width="150" height="150" alt={resHeading}/>
  );

  return (
    <Layout>
      <Layout.Section oneHalf>
        <Card>
          {loaderAddToCart && <Loading />}
          <div className="resource-list-header">
            <TextContainer>
              <Heading>{`Find a product`}</Heading>
            </TextContainer>
          </div>
          <div style={{padding: '16px', display: 'flex'}}>
            <div style={{flex:1}}>
              <Filters
                queryValue={queryValue}
                filters={filters}
                appliedFilters={appliedFilters}
                onQueryChange={setQueryValue}
                onQueryClear={handleQueryValueRemove}
                onClearAll={handleClearAll}
              >
              </Filters>
            </div>
          </div>
          <IndexTable
            resourceName={{
              singular: 'product',
              plural: 'products'
            }}
            itemCount={
              productsArr ? productsArr.length : 0
            }
            selectedItemsCount={
              allResourcesSelected ? 'All' : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            promotedBulkActions={promotedBulkActions}
            headings={[
              { title: 'Product Image' },
              { title: 'Product Title' },
              { title: '' },
              { title: 'View' },
            ]}
            selectable={true}
            loading={isLoading}
          >
            {rowMarkup}
          </IndexTable>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1%' }}>
            <Pagination
              hasPrevious={
                ( prevPage !== false ) ? true : false
              }
              previousTooltip="Previous"
              onPrevious={() => {
                get_product_list( prevPage, 'before' );
              }}

              hasNext={
                ( nextPage !== false ) ? true : false
              }
              nextTooltip="Next"
              onNext={() => {
                get_product_list( nextPage, 'after' );
              }}
            />
          </div>
          {toastMarkup}
        </Card>
      </Layout.Section>
      {productsArr.length > 0 && <Layout.Section oneHalf>
        <div className="view-card">
          <div className="resource-list-header">
            <TextContainer>
              <Heading>{resHeading}</Heading>
            </TextContainer>
            <Scrollable shadow={true} vertical={true} style={{height: 'calc(85vh)'}}>
              <Card>
                <Card.Section>
                  {imageUrlHtml}
                  <TextContainer>
                    <Heading element={'h2'}>Product description</Heading>
                    <div className="product-description" dangerouslySetInnerHTML={{__html: resDescription}}>
                    </div>
                    <Heading element="h2">Product URL</Heading>
                    <Link url={resPreviewUrl} external={'true'} monochrome>
                      {resPreviewUrl}
                    </Link>
                    <Heading element="h2">Product Admin URL</Heading>
                    <Link url={resEditUrl} external={'true'} monochrome>
                      {resEditUrl}
                    </Link>
                  </TextContainer>
                </Card.Section>
              </Card>
            </Scrollable>
          </div>
        </div>
      </Layout.Section>}
    </Layout>
  );

}

const ProductsPage = ( props ) => {

  return (
    <Page
      fullWidth
      title="Products"
      primaryAction={{
        content: 'Cart ('+ props.totalCartCount +')',
        icon: CartMajor,
        onAction: () => {
          props.setPage( '/cart' )
        }
      }}
    >
      <ProductsIndexTable setTotalCartCount={props.setTotalCartCount} setPage={props.setPage} />
    </Page>
  );
};

export default ProductsPage;
