import {
  useState,
  useCallback,
  useEffect
} from "react";

import {
  Heading,
  Page,
  Layout,
  Frame,
  Card,
  TextStyle,
  Loading,
  TextContainer,
  DataTable,
  Button,
  Toast,
  Modal,
  ButtonGroup,
  Pagination,
  Stack,
  useIndexResourceState,
} from "@shopify/polaris";

import {
  CartMajor,
  MobileHamburgerMajor,
  ViewMajor,
  RefreshMajor,
  GrammarMajor
} from '@shopify/polaris-icons';

const DashboardMarkup = (props) => {
  useEffect(() => {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var charge_id = url.searchParams.get("charge_id");
    if (charge_id) {
      fetch(
        '/insert_app_charge_data',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            charge_id: charge_id
          })
        }
      ).then((res) => res.json()).then((data) => {
        // console.log('data', data);
      })
    }

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

          setTotalCartCount(getTotalCount);
        }
      }
    })

    getProductDescriptionOrder();
  }, [])

  const getProductDescriptionOrder = (prev_or_next = false) => {
    const obj = {
      status: 'APPROVED',
      isUpdatedStatus: "APPROVED",
      pageNumber: prev_or_next
    }

    fetch(
      '/get_product_description_orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
      }
    ).then((res) => res.json()).then((response) => {
      if (response.status == 200) {
        setPendingOrder(response.pendingOrder)

        let lastOrders = [];
        if (response.pendingOrder.length) {

          response.pendingOrder.map((order, i) => {

            const order_details = order.order_details[0];
            const product_descriptions = order.product_description[0];

            lastOrders.push([
              product_descriptions.product_id,
              product_descriptions.product_title,
              formatDate(order_details.application_charge.created_at),
              <Button onClick={ e => toggleModalActive(order) }>View</Button>
            ])

          })
        }

        setPrevPage(response.prevPage);
        setNextPage(response.nextPage);
        setTotalCount(response.total_count);
        setLastOrders(lastOrders);
      }
    })
  };

  const [pendingOrder, setPendingOrder] = useState([]);
  const [isLoading, setLoading] = useState(false)
  const [toastActive, setToastActive] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [page, setPage] = useState('/')
  const [totalCartCount, setTotalCartCount] = useState(0)
  const [lastOrders, setLastOrders] = useState([])
  const [ modalActive, setModalActive ] = useState(false);
  const [ orderData, setOrderData ] = useState([]);
  const [prevPage, setPrevPage] = useState(false);
  const [nextPage, setNextPage] = useState(false);
  const [total_count, setTotalCount] = useState(0);

  const toggleModalActive = useCallback((orderItem) => {
    setOrderData(orderItem)
    setModalActive((modalActive) => !modalActive)
  }, []);

  const toggleToastActive = useCallback((active) => { setToastActive(false) }, []);

  const toastMarkup = toastActive ? (
    <Toast content={toastMessage} onDismiss={toggleToastActive} />
  ) : null;

  function formatDate(date) {

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear(),
    hours = d.getHours(),
    minutes = d.getMinutes();

    hours = hours % 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;

    month = monthNames[d.getMonth()]

    if (day.length < 2)
    day = '0' + day;

    const time = [ hours, minutes ].join(':');
    const finalDate = [ day, month, year ].join(' ');

    return finalDate+' '+time;
  }

  const descriptionBtnClick = ( evt, orderData, action, task, orderId ) => {

    let contentHtml = "";
    if ( task == 'description' ) {
      contentHtml = orderData.product_description;
    } else if (task == 'bullet-points') {
      contentHtml = orderData.bullet_points;
    } else if (task == 'meta-description') {
      contentHtml = orderData.meta_description;
    }

    setLoading(true);
    fetch(
      '/update_product_description',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: orderData.product_id,
          contentHtml: contentHtml,
          contentType:orderData.content_type,
          action: action,
          task: task,
          orderId: orderId
        })
      }
    ).then((res) => res.json()).then((response) => {
      setLoading(false);

      if (response.status == 200) {

        // Update the states START
        console.log( 'orderId',  orderId );
        console.log( 'pendingOrder', pendingOrder );
        console.log( 'lastOrders', lastOrders );
        let newPendingOrders = [];
        for ( var i = 0; i < pendingOrder.length; i++ ) {
          if ( pendingOrder[i]._id === orderId ) {
            newPendingOrders.push( response.updated_row );
          } else {
            newPendingOrders.push( pendingOrder[i] );
          }
        }
        console.log( 'newPendingOrders',newPendingOrders );
        setPendingOrder(newPendingOrders)

        let lastOrders = [];
        if (newPendingOrders.length) {
          newPendingOrders.map((order, i) => {
            const order_details = order.order_details[0];
            const product_descriptions = order.product_description[0];
            lastOrders.push([
              product_descriptions.product_id,
              product_descriptions.product_title,
              formatDate(order_details.application_charge.created_at),
              <Button onClick={ e => toggleModalActive(order) }>View</Button>
            ])
          })
        }
        setLastOrders(lastOrders);

        setOrderData(response.updated_row);
        // Update the states END

        setToastMessage(response.msg);
        setToastActive(true);
      }
    })
  }

  const copyBtnClick = (evt, textToCopy, orderId) => {

    update_product_meta_status(orderId);

    var tempText = document.createElement("input");
    tempText.value = textToCopy;
    tempText.id = "CopyText";
    document.body.appendChild(tempText);

    var copyText = document.getElementById("CopyText");

    console.log('copyText', copyText);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    document.body.removeChild(copyText);

    setIsCopied(true);
  }

  const openPreviewBtnClick = (evt, previewUrl, orderId) => {
    update_product_meta_status(orderId);
    window.open( previewUrl, '_blank' );
  }

  const update_product_meta_status = ( orderId ) => {
    fetch(
      '/update_product_meta_status',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId
        })
      }
    ).then((res) => res.json()).then((response) => {

      getProductDescriptionOrder();

    })
  }

  const ModalMarkup = () => {

    const orderItem = orderData.product_description[0];
    const isDescriptionOrdered = orderItem.isDescriptionOrdered;
    const isMetaDescriptionOrdered = orderItem.isMetaDescriptionOrdered;
    const areBulletPointsOrdered = orderItem.isBulletPointsOrdered;
    const contentType = orderItem.content_type;

    const bullet_points_status = orderData.bullet_points_status != undefined ? orderData.bullet_points_status : "PENDING";
    const meta_description_status = orderData.meta_description_status != undefined ? orderData.meta_description_status : "PENDING";
    const product_description_status = orderData.product_description_status != undefined ? orderData.product_description_status : "PENDING";

    let previewUrl = "";

    if ( orderData.order_details[0] !== undefined ) {
      let obj = orderData.order_details[0].cart_contents.find(o => o.sourceId === orderData.sourceId);
      previewUrl = obj.previewUrl;
    }

    return(
      <div>
        <p className="ordered-description-row-note"><span>Note: </span>Click  <b>Add</b> below to add this text to your product or collection page. If you already have content there, our content will automatically be added underneath. You will need to delete your old content manually.</p>
        {
          !!isMetaDescriptionOrdered &&
          <p className="ordered-description-row-note">
            <span>Note: </span>Please note that we cannot automatically add your meta description. You’ll need to manually copy paste this into your product meta description.
          </p>
        }
        <div className="ordered-description-row">
          <div className="ordered-description-row-image">
            <img src={orderItem.product_img}/>
          </div>
          <div className="ordered-description-row-content">
            <Heading className="ordered-description-row-title">{orderItem.product_title}</Heading>
            {!!isDescriptionOrdered && <Card className="ordered-description-row-card">
              <TextStyle variation="strong">Updated Description</TextStyle>
              <p className="ordered-description-row-html" dangerouslySetInnerHTML={{__html: orderItem.product_description}}></p>
              <ButtonGroup>
                <Button
                  primary
                  icon={product_description_status == 'PENDING' ? MobileHamburgerMajor : GrammarMajor}
                  onClick={e => descriptionBtnClick(e, orderItem, 'Add', 'description', orderData._id)}
                  disabled={ product_description_status != 'PENDING' }
                >
                  { product_description_status == 'PENDING' ? 'Add' : 'Added' }
                </Button>
                {/*<Button destructive icon={RefreshMajor} onClick={e => descriptionBtnClick(e, orderItem, 'Replace', 'description')}>Overwrite</Button>*/}
              </ButtonGroup>
            </Card>}
            {!!isMetaDescriptionOrdered && <Card className="ordered-description-row-card">
              <TextStyle variation="strong">Updated Meta Description</TextStyle>
              <p className="ordered-description-row-html">{orderItem.meta_description}</p>
              <ButtonGroup>
                {/*contentType == 'product' && <Button destructive icon={RefreshMajor} onClick={e => descriptionBtnClick(e, orderItem, 'Replace', 'meta-description')}>Overwrite</Button>*/}
                <Button destructive icon={RefreshMajor} onClick={e => copyBtnClick(e, orderItem.meta_description, orderData._id)}>{isCopied ? 'Copied!' : 'Copy'}</Button>
                <Button primary icon={ViewMajor} url={previewUrl} onClick={e => openPreviewBtnClick(e, previewUrl, orderData._id)} external={'true'}>View</Button>
              </ButtonGroup>
            </Card>}
            {!!areBulletPointsOrdered && <Card className="ordered-description-row-card">
              <TextStyle variation="strong">Updated Bullet Points</TextStyle>
              <p className="ordered-description-row-html" dangerouslySetInnerHTML={{__html: orderItem.bullet_points}}></p>
              <ButtonGroup>
                <Button
                  primary
                  icon={bullet_points_status == 'PENDING' ? MobileHamburgerMajor : GrammarMajor}
                  onClick={e => descriptionBtnClick(e, orderItem, 'Add', 'bullet-points', orderData._id)}
                  disabled={ bullet_points_status != 'PENDING' }
                >
                  { bullet_points_status == 'PENDING' ? 'Add' : 'Added' }
                </Button>
                {/*<Button destructive icon={RefreshMajor} onClick={e => descriptionBtnClick(e, orderItem, 'Replace', 'bullet-points')}>Overwrite</Button>*/}
              </ButtonGroup>
            </Card>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Page
      fullWidth
      title="Dashboard"
      primaryAction={{
        content: 'Cart ('+ totalCartCount +')',
        icon: CartMajor,
        onAction: () => {
          props.setPage( '/cart' )
        }
      }}>
      <Layout>
        <Layout.Section oneThird>
          {isLoading && <Loading />}
          <div className="dashboard-table">
            <Card>
              <div className="tab-header">
                <TextContainer>
                  <Heading element="h2">Approved Content</Heading>
                  <p className="tab-text"></p>
                </TextContainer>
              </div>
              <div className="">
                <DataTable
                  columnContentTypes={[
                    'text',
                    'text',
                    'text',
                    'text'
                  ]}
                  headings={[
                    'ID',
                    'Name',
                    'Payment Date',
                    'Action'
                  ]}
                  rows={lastOrders}
                  footerContent={!!lastOrders.length && (
                    <Stack alignment="center" distribution="center">
                      <Pagination
                        hasPrevious={prevPage}
                        onPrevious={() => {
                          getProductDescriptionOrder(prevPage);
                        }}
                        hasNext={nextPage}
                        onNext={() => {
                          getProductDescriptionOrder(nextPage);
                        }}
                      />
                    </Stack>
                  )}
                />
                {!lastOrders.length && <div className="approved-content"><Heading element="p">No Approved Content</Heading></div>}
                {
                  modalActive &&
                  <div style={{height: '500px'}}>
                    <Modal
                      large
                      open={modalActive}
                      onClose={ e => toggleModalActive([]) }
                      title="Approved Content"
                      secondaryActions={[
                        {
                          content: 'Cancel',
                          onAction: toggleModalActive,
                        },
                      ]}
                    >
                      <Modal.Section>
                        <ModalMarkup />
                      </Modal.Section>
                    </Modal>
                  </div>
                }
              </div>
            </Card>
          </div>
          {toastMarkup}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default DashboardMarkup;
