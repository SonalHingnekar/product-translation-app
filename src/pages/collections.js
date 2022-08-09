import {
  useState,
  useCallback,
  useEffect
} from "react";

import profilePic from '../../public/img-dummy-product.jpg';

import {
  Page,
  Filters,
  Card,
  TextField,
  IndexTable,
  Pagination,
  TextStyle,
  Button,
  Toast,
  Loading,
  Layout,
  TextContainer,
  Heading,
  Scrollable,
  Link,
  useIndexResourceState
} from "@shopify/polaris";

import {
  CartMajor,
  ViewMajor,
  TickMinor
} from '@shopify/polaris-icons';

const CollectionsIndexTable = (props) => {

  useEffect(() => {
    get_collection_list();
  }, [queryValue])



  const [taggedWith, setTaggedWith] = useState(null);
  const [queryValue, setQueryValue] = useState(null);
  const [nextPage, setNextPage] = useState(false);
  const [prevPage, setPrevPage] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [collectionsArr, setCollections] = useState([]);

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

  const get_collection_list = ( page_info = false, prev_or_next = false ) => {
    setLoading( true );
    fetch(
      '/get_collection_list',
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

      console.log( 'data', data );

      if ( data.hasOwnProperty( 'prevPage' ) ) {
        setPrevPage( data.prevPage );
      }

      if ( data.hasOwnProperty( 'nextPage' ) ) {
        setNextPage( data.nextPage );
      }

      if (data.collections.length) {

        const collectionNode = data.collections[0].node;
        const host = 'https://' + data.shop;
        const previewUrl = host+'/products/'+collectionNode.handle
        const editUrl = host+'/admin/products/'+collectionNode.legacyResourceId
        const featuredImage = collectionNode.image !== null ? collectionNode.image.src : '';

        setShop(data.shop);
        setResHeading(collectionNode.title);
        setResImage(featuredImage);
        setResDescription(collectionNode.descriptionHtml);
        setResPreviewUrl(previewUrl);
        setResEditUrl(editUrl);
      }

      setCollections( data.collections );
      setLoading( false );
    })
  };

  const resourceIDResolver = (collectionsArr) => {
    return collectionsArr.node.legacyResourceId;
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(collectionsArr, {
    resourceIDResolver,
  });

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

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === '' || value == null;
    }
  }

  const appliedFilters = !isEmpty(taggedWith)
    ? [
        {
          key: 'taggedWith',
          label: disambiguateLabel('taggedWith', taggedWith),
          onRemove: handleTaggedWithRemove,
        },
      ]
    : [];

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

  const promotedBulkActions = [
    {
      content: 'Add To Cart',
      onAction: () => {

        setLoaderAddToCart(true)
        // Multiple product add to cart START
        selectedResources.map((legacyResourceId, index)=>{

          var collection_obj_by_id = collectionsArr.find(obj => {
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
                contentType: 'collection',
                product_handle: collection_obj_by_id.node.handle,
                product: collection_obj_by_id.node,
              })
            }
          ).then(
            (res) => res.json()
          ).then((data) => {
            // console.log( 'data', data );
            if (index == (selectedResources.length - 1)) {
              props.get_cart_count();
              setToastActive(true)
              setLoaderAddToCart(false)
            }
          })

        })

      }
    },
  ];

  const toastMarkup = toastActive ? (
    <Toast content="Collection added to cart" onDismiss={toggleToastActive} />
  ) : null;

  const handleAddToCart = ( collectionObj, index ) => {
    const host = 'https://' + shop;
    const previewUrl = host+'/collections/'+collectionObj.handle
    const editUrl = host+'/admin/collections/'+collectionObj.legacyResourceId
    const featuredImage = collectionObj.image !== null ? collectionObj.image.src : '';

    setIsActive(index);
    setResHeading(collectionObj.title);
    setResImage(featuredImage);
    setResDescription(collectionObj.descriptionHtml);
    setResPreviewUrl(previewUrl);
    setResEditUrl(editUrl);
  }

  console.log('collectionsArr', collectionsArr);

  const rowMarkup = collectionsArr.map(
    ( { node }, index) => (
      <IndexTable.Row
        id={node.legacyResourceId}
        key={node.legacyResourceId}
        selected={ selectedResources.includes(node.legacyResourceId) }
        position={index}
      >
        <IndexTable.Cell>
          <TextStyle variation="strong">{node.title}</TextStyle>
        </IndexTable.Cell>
        <IndexTable.Cell>
          { !!node.isOrderedPrevious && <Button onClick={ () => { redirectDashboard() }} icon={TickMinor} plain={true}></Button>}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Button onClick={ () => { handleAddToCart( collectionsArr[index].node, index ) }} id={ (isActive == index) ? 'previewActive' : '' } icon={ViewMajor} plain={true}>
          </Button>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const redirectDashboard = () => {
    props.setPage('/');
  }

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
              <Heading>{`Find a Collection`}</Heading>
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
              singular: 'collection',
              plural: 'collections'
            }}
            itemCount={
              collectionsArr ? collectionsArr.length : 0
            }
            selectedItemsCount={
              allResourcesSelected ? 'All' : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            promotedBulkActions={promotedBulkActions}
            headings={[
              { title: 'Collection Title' },
              { title: '' },
              { title: 'Action' },
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
      {collectionsArr.length > 0 && <Layout.Section oneHalf>
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
                    <Heading element={'h2'}>Collection description</Heading>
                    <div className="product-description" dangerouslySetInnerHTML={{__html: resDescription}}>
                    </div>
                    <Heading element="h2">Collection URL</Heading>
                    <Link url={resPreviewUrl} external={'true'} monochrome>
                      {resPreviewUrl}
                    </Link>
                    <Heading element="h2">Collection Admin URL</Heading>
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

const CollectionsPage = ( props ) => {

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

  return (
    <Page
      fullWidth
      title="Collections"
      primaryAction={{
        content: 'Cart ('+ props.totalCartCount +')',
        icon: CartMajor,
        onAction: () => {
          props.setPage( '/cart' )
        }
      }}
    >
      <CollectionsIndexTable setTotalCartCount={props.setTotalCartCount} get_cart_count={get_cart_count} setPage={props.setPage}/>
    </Page>
  );
};

export default CollectionsPage;
