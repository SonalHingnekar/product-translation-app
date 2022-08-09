import {
  useState,
  useEffect,
  useCallback
} from "react";

import {
  Page,
  Layout,
  Card,
  Heading,
  ButtonGroup,
  Button,
  TextStyle,
  Modal,
  TextField,
  Toast,
  Pagination,
  Stack
} from "@shopify/polaris";

import {
  TickMinor,
  UndoMajor,
  MobileHamburgerMajor,
  RefreshMajor,
  ViewMinor,
  ViewMajor
} from '@shopify/polaris-icons';

import CustomAccordion from '../components/customaccordion';

const PendingValidationPage = () => {

  const [ completedOrder, setCompletedOrder ] = useState([]);
  const [ isCopied, setIsCopied ] = useState(false)
  const [ isLoading, setLoading ] = useState(false)
  const [ toastActive, setToastActive ] = useState(false)
  const [ toastMessage, setToastMessage ] = useState('')
  const [ modalActive, setModalActive ] = useState(false);
  const [ approvedModalActive, setApprovedModalActive ] = useState(false);
  const [ revisionValue, setRevision ] = useState('');
  const [ sourceId, setSourceId ] = useState('');
  const [ prevPage, setPrevPage ] = useState(false);
  const [ nextPage, setNextPage ] = useState(false);
  const [ total_count, setTotalCount ] = useState(0);
  const [ orderData, setOrderData ] = useState([]);

  useEffect(() => {

    getProductDescriptionOrder();
  }, []);

  const getProductDescriptionOrder = (prev_or_next = false) => {
    const obj = {
      status: '',
      isUpdatedStatus: "PENDING",
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

        setPrevPage(response.prevPage);
        setNextPage(response.nextPage);
        setTotalCount(response.total_count);
        setCompletedOrder(response.pendingOrder)

      }
    })
  }

  const toggleToastActive = useCallback((active) => { setToastActive(false) }, []);
  const toggleModalActive = useCallback((orderItem) => {
    setSourceId(orderItem.product_id)
    setModalActive((modalActive) => !modalActive)
  }, []);

  const toggleApprovedModalActive = useCallback(() => {
    setApprovedModalActive((modalActive) => !modalActive)
  }, []);
  const handleChangeRevision = useCallback((newValue) => setRevision(newValue), []);

  const toastMarkup = toastActive ? (
    <Toast content={toastMessage} onDismiss={toggleToastActive} />
  ) : null;

  const handleModalOpen = ( orderData ) => {
    setOrderData(orderData);
    setApprovedModalActive(true);
  }

  const handleRequestVerification = ( orderData, orderId, status) => {

    setOrderData(orderData);

    setLoading(true);
    if ( !revisionValue && status == "IN_REVIEW") {
      setLoading(false);
      return;
    }
    const sourceId = orderId.toString();
    fetch(
      '/update_product_status',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status,
          sourceId: sourceId,
          note: revisionValue
        })
      }
    ).then((res) => res.json()).then((response) => {

      if ( status == 'APPROVED' ) {
        setApprovedModalActive(true);
      }
      setLoading(false);
      setModalActive(false);
      setRevision('');
      setToastActive(true)
      setToastMessage(response.msg)
      getProductDescriptionOrder();
    })
  }

  const openPreviewBtnClick = (evt, previewUrl, orderId) => {
    update_product_meta_status(orderId);
    window.open( previewUrl, '_blank' );
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

  const descriptionBtnClick = ( evt, orderDataArr, action, task, orderId ) => {

    let contentHtml = "";
    if ( task == 'description' ) {
      contentHtml = orderDataArr.product_description;
    } else if (task == 'bullet-points') {
      contentHtml = orderDataArr.bullet_points;
    } else if (task == 'meta-description') {
      contentHtml = orderDataArr.meta_description;
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
          product_id: orderDataArr.product_id,
          contentHtml: contentHtml,
          contentType:orderDataArr.content_type,
          action: action,
          task: task,
          orderId: orderId
        })
      }
    ).then((res) => res.json()).then((response) => {

      getProductDescriptionOrder();
      setLoading(false);
      if (response.status == 200) {
        setToastMessage(response.msg);
        setToastActive(true);
      }
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
                {/*<Button destructive icon={RefreshMajor} onClick={e => descriptionBtnClick(e, orderItem, 'Replace', 'description', orderData._id)}>Overwrite</Button>*/}
              </ButtonGroup>
            </Card>}
            {!!isMetaDescriptionOrdered && <Card className="ordered-description-row-card">
              <TextStyle variation="strong">Updated Meta Description</TextStyle>
              <p className="ordered-description-row-html">{orderItem.meta_description}</p>
              <ButtonGroup>
                {/*contentType == 'product' && <Button destructive icon={RefreshMajor} onClick={e => descriptionBtnClick(e, orderItem, 'Replace', 'meta-description', orderData._id)}>Overwrite</Button>*/}
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
                {/*<Button destructive icon={RefreshMajor} onClick={e => descriptionBtnClick(e, orderItem, 'Replace', 'bullet-points', orderData._id)}>Overwrite</Button>*/}
              </ButtonGroup>
            </Card>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Page
      fullWidth
      title="Pending Validation"
    >
      <Layout>
        <Layout.Section oneThird>
          <Card
            sectioned>
            { !completedOrder.length && <Heading element="p">No Pending Tasks</Heading> }
            {completedOrder.map((order, i) => {
              return(
                <CustomAccordion
                key={i}
                accordionIndex={i+1}
                accordionTitle={`Product Ordered`}
                >
                  <div className="cart-items">
                    <Card.Section>
                      {order.product_description.map(( orderItem, key ) => {

                        const orderStatus = order.status;
                        const isDescriptionOrdered = orderItem.isDescriptionOrdered;
                        const isMetaDescriptionOrdered = orderItem.isMetaDescriptionOrdered;
                        const areBulletPointsOrdered = orderItem.isBulletPointsOrdered;
                        const contentType = orderItem.contentType;
                        let previewUrl = "";

                        if ( order.order_details[0] !== undefined ) {
                          let obj = order.order_details[0].cart_contents.find(o => o.sourceId === order.sourceId);
                          previewUrl = obj.previewUrl;
                        }

                        return (
                          <div key={key}>
                            <div className="ordered-description-row">
                              <div className="ordered-description-row-image">
                                <img src={orderItem.product_img}/>
                              </div>
                              <div className="ordered-description-row-content">
                                <Heading className="ordered-description-row-title">{orderItem.product_title}</Heading>
                                { (!!isDescriptionOrdered && orderStatus != "IN_PROGRESS") && <Card className="ordered-description-row-card">
                                  <TextStyle variation="strong">Updated Description</TextStyle>
                                  <p className="ordered-description-row-html" dangerouslySetInnerHTML={{__html: orderItem.product_description}}></p>
                                </Card>}
                                { (!!isMetaDescriptionOrdered && orderStatus != "IN_PROGRESS") &&  <Card className="ordered-description-row-card">
                                  <TextStyle variation="strong">Updated Meta Description</TextStyle>
                                  <p className="ordered-description-row-html">{orderItem.meta_description}</p>
                                </Card>}
                                { (!!areBulletPointsOrdered && orderStatus != "IN_PROGRESS") &&  <Card className="ordered-description-row-card">
                                  <TextStyle variation="strong">Updated Bullet Points</TextStyle>
                                  <p className="ordered-description-row-html" dangerouslySetInnerHTML={{__html: orderItem.bullet_points}}></p>
                                </Card>}
                                { ( orderStatus == "PENDING_APPROVAL" ) && <ButtonGroup>
                                  <Button primary icon={TickMinor} onClick={e => handleRequestVerification( order, orderItem.product_id, "APPROVED")}>Approve</Button>
                                  <Button destructive icon={UndoMajor} onClick={ e => toggleModalActive(orderItem) }>Request revision</Button>
                                </ButtonGroup>}
                                { ( orderStatus == "APPROVED" ) && <ButtonGroup>
                                  <Button primary icon={ViewMinor} onClick={e => handleModalOpen( order )}>View</Button>
                                </ButtonGroup>}
                                { orderStatus == "IN_REVIEW" && <p className="ordered-description-review-text">Our team is working on your revisions. We'll get back to you soon!</p>}
                                { orderStatus == "IN_PROGRESS" && <p className="ordered-description-review-text">In progress. We'll get back to you soon!</p>}
                              </div>
                              { modalActive && <div style={{height: '500px'}}>
                                <Modal
                                  small
                                  open={modalActive}
                                  onClose={ e => toggleModalActive(orderItem) }
                                  title="Request revision"
                                  primaryAction={{
                                    content: 'Request revision',
                                    onAction: e => handleRequestVerification( order, sourceId, "IN_REVIEW"),
                                  }}
                                  secondaryActions={[
                                    {
                                      content: 'Cancel',
                                      onAction: toggleModalActive,
                                    },
                                  ]}
                                >
                                  <Modal.Section>
                                    <TextField
                                      label="Note for revision"
                                      value={ revisionValue }
                                      onChange={handleChangeRevision}
                                      multiline={3}
                                      autoComplete="off"
                                    />
                                  </Modal.Section>
                                </Modal>
                              </div>}
                              { approvedModalActive && <div style={{height: '500px'}}>
                                <Modal
                                  large
                                  open={approvedModalActive}
                                  onClose={ e => toggleApprovedModalActive([]) }
                                  title="Approved Content"
                                  secondaryActions={[
                                    {
                                      content: 'Cancel',
                                      onAction: toggleApprovedModalActive,
                                    },
                                  ]}
                                >
                                  <Modal.Section>
                                    <ModalMarkup/>
                                  </Modal.Section>
                                </Modal>
                              </div>}
                            </div>
                            <hr></hr>
                          </div>
                        );

                      })}
                    </Card.Section>
                  </div>
                </CustomAccordion>
              )
            })}
            {!!completedOrder.length && (
              <div className="pagination-wrap">
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
              </div>
            )}
          </Card>
          {toastMarkup}
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default PendingValidationPage;
