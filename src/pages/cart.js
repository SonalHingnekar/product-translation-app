import {
  useState,
  useCallback,
  useEffect
} from "react";

import {
  Page,
  Layout,
  TextContainer,
  Heading,
  Card,
  TextField,
  TextStyle,
  ButtonGroup,
  Button,
  Icon,
  EmptyState,
  ResourceList,
  ResourceItem,
  Avatar,
  Stack,
  InlineError,
  Select,
  SkeletonPage,
  SkeletonBodyText,
  Collapsible,
  Checkbox,
  Tooltip,
  Loading,
  useIndexResourceState
} from "@shopify/polaris";

import {
  HomeMajor,
  NoteMajor,
  ProductsMajor,
  ChevronUpMinor,
  ChevronDownMinor,
  CreditCardMajor,
  DeleteMajor,
  InfoMinor,
  CartMajor
} from '@shopify/polaris-icons';


const CartPage = ( props ) => {

  const [isLoading, setLoading] = useState(true)
  const [payLoading, setPayLoading] = useState(false)
  const [cartItems, setCartItems] = useState([]);
  const [descriptionAmount, setDescriptionAmount] = useState({100:5,300:10,500:15});
  const [metaDescription, setMetaDescription] = useState(5);
  const [bulletPoints, setBulletPoints] = useState(8);
  const [collectionArr, setCollectionArr] = useState([]);
  const [cartSummary, setCartSummary] = useState({});
  const [creditAmount, setCreditAmount] = useState(0);

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
      console.log('response', response);
      if (response.status == 200) {

        let getTotalCount = 0;
        if (response.data.length) {
          getTotalCount = response.data.reduce((total, obj) => obj.count + total,0);
        }
        props.setTotalCartCount(getTotalCount);
      }
    })
  }

  const remove_cart_contents = ( sourceId = -1 ) => {
    setLoading( true );
    fetch(
      '/remove_cart_contents',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceId: sourceId
        })
      }
    ).then((res) => res.json()).then((data) => {
      // console.log( 'data.cart', data.cart );
      get_cart_count();
      if ( data.cart.hasOwnProperty( 'cart_contents' ) ) {
        // console.log( 'data.cart.cart_contents', data.cart.cart_contents );

        let filtered_products = data.cart.cart_contents.filter((cart) => {
          return cart.contentType == 'product';
        });

        let filtered_collections = data.cart.cart_contents.filter((cart) => {
          return cart.contentType == 'collection';
        });
        setCartItems( filtered_products );
        setCollectionArr( filtered_collections );
      }
      setLoading( false );
    })
  }

  useEffect(() => {

    setLoading( true );
    fetch(
      '/get_cart_contents',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        })
      }
    ).then((res) => res.json()).then((data) => {
      // console.log( 'data', data );

      if ( data.hasOwnProperty( 'cart' ) ) {
        if ( data.cart.hasOwnProperty( 'cart_contents' ) ) {
          // console.log( 'data.cart.cart_contents', data.cart.cart_contents );
          let filtered_products = data.cart.cart_contents.filter((cart) => {
            return cart.contentType == 'product';
          });

          let filtered_collections = data.cart.cart_contents.filter((cart) => {
            return cart.contentType == 'collection';
          });
          setCartItems( filtered_products );
          setCollectionArr( filtered_collections );
        }
      }

      setLoading( false );
    })

    fetch(
      '/get_application_credit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    ).then((res) => res.json())
    .then((response) => {
      if (response.status == 200) {
        let creditAmountResponse = parseInt(response.creditAmount);
        setCreditAmount(creditAmountResponse);
      }
    })

    fetch(
      '/get_pricing_contents',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    ).then((res) => res.json())
    .then((response) => {
      if (response.status == 200) {
        if (response.data.length) {
          setDescriptionAmount(response.data[0].descriptionAmount);
          setMetaDescription(response.data[0].metaDescription);
          setBulletPoints(response.data[0].bulletPoints);
        }
      }
    })

  }, [])

  const emptyStateMarkup = ( !isLoading && !cartItems.length ) ? ( <EmptyState heading="Add products to cart" /> ) : undefined;


  const RenderItem = ( props ) => {

    const { title, sourceId, imageUrl, isDescriptionOrdered, isMetaDescriptionOrdered, areBulletPointsOrdered, wordsNumberInterval, contentType } = props.cartItem;
    const { changeCartItemTask } = props;

    const handleDescriptionCheckboxChange = useCallback(
      (newChecked) => {
        changeCartItemTask( sourceId, {
          isDescriptionOrdered:     newChecked,
          isMetaDescriptionOrdered: isMetaDescriptionOrdered,
          areBulletPointsOrdered:   areBulletPointsOrdered,
          wordsNumberInterval:      wordsNumberInterval
        });
      }, []
    );

    const handleMetaDescriptionCheckboxChange = useCallback(
      (newChecked) => {
        changeCartItemTask( sourceId, {
          isDescriptionOrdered:     isDescriptionOrdered,
          isMetaDescriptionOrdered: newChecked,
          areBulletPointsOrdered:   areBulletPointsOrdered,
          wordsNumberInterval:      wordsNumberInterval
        });
      }, []
    );

    const handleBulletPointsCheckboxChange = useCallback(
      (newChecked) => {
        changeCartItemTask( sourceId, {
          isDescriptionOrdered:     isDescriptionOrdered,
          isMetaDescriptionOrdered: isMetaDescriptionOrdered,
          areBulletPointsOrdered:   newChecked,
          wordsNumberInterval:      wordsNumberInterval
        });
      }, []
    );

    const handleSelectChange = useCallback(
      (new_value) => {
        changeCartItemTask( sourceId, {
          isDescriptionOrdered:     isDescriptionOrdered,
          isMetaDescriptionOrdered: isMetaDescriptionOrdered,
          areBulletPointsOrdered:   areBulletPointsOrdered,
          wordsNumberInterval:      new_value
        });
      }, []
    );

    return (
      <div className="cart-item">
        <div className="cart-item-top-section">
          <div className="cart-item-image-text-div">
            <div className="cart-item-image-div">
              <img className="cart-item-image b" alt="" src={imageUrl} />
            </div>
            <div className="cart-item-text">
              <Heading>{title}</Heading>
              <div className="cart-item-text-checkbox-text-div">
                <span>What do you want to be written ?</span>
                <Tooltip active content="Our writer can write and optimize your title and description which will appear in the search engines." active={false}>
                  <TextStyle variation="strong">
                    <Icon source={InfoMinor} />
                  </TextStyle>
                </Tooltip>
              </div>
              <div className="cart-item-checkboxes">
                <Checkbox label="Description" checked={isDescriptionOrdered} onChange={handleDescriptionCheckboxChange} />
                <Checkbox label={`Meta Description ($${metaDescription})`} checked={isMetaDescriptionOrdered} onChange={handleMetaDescriptionCheckboxChange} />
                {contentType !== 'collection' && <Checkbox label={`Bullet Points ($${bulletPoints})`} checked={areBulletPointsOrdered} onChange={handleBulletPointsCheckboxChange} />}
                {
                  !!isDescriptionOrdered &&
                  <Select
                    label="How much words do you want ?"
                    options={[
                      { label: '100 Words - $' + descriptionAmount[100], value: '100' },
                      { label: '300 Words - $' + descriptionAmount[300], value: '300' },
                      { label: '500 Words - $' + descriptionAmount[500], value: '500' },
                    ]}
                    onChange={handleSelectChange}
                    value={wordsNumberInterval}
                  />
                }
              </div>
            </div>
          </div>
          <Button icon={DeleteMajor} onClick={() => {remove_cart_contents( sourceId )}}></Button>
        </div>
      </div>
    );
  }


  const [tasks, setTasks] = useState({
    all: false,
    description: false,
    meta_description: false,
    bullet_points: false
  });

  const updateTasks = ( task, add_or_remove = true ) => {
    let taskObj = {};
    if ( 'all' == task ) {
      if (add_or_remove) {
        taskObj.all = true;
        taskObj.description = true;
        taskObj.meta_description = true;
        taskObj.bullet_points = true;
      } else {
        taskObj.all = false;
        taskObj.description = false;
        taskObj.meta_description = false;
        taskObj.bullet_points = false;
      }
    } else {
      taskObj[task] = add_or_remove;
    }
    let newTaskObj = {...tasks, ...taskObj};
    if (
      newTaskObj.description &&
      newTaskObj.meta_description &&
      newTaskObj.bullet_points
    ) {
      newTaskObj.all = true;
    } else {
      newTaskObj.all = false;
    }
    setTasks(newTaskObj);
  }

  const [task_title, setTaskTitle] = useState('');
  const [task_title_error, setTaskTitleError] = useState( false );
  const handleChangeTaskTitle = useCallback((newValue) => setTaskTitle(newValue), []);
  const handleClearButtonClickTaskTitle = useCallback(() => setTaskTitle(''), []);
  useEffect(() => {
    if (task_title) {
      setTaskTitleError(false);
    }
  }, [task_title]);

  const [ shopPassword, setShopPassword ] = useState('');
  const handleChangeShopPass = useCallback((newValue) => setShopPassword(newValue), []);
  const handleClearButtonClickShopPass = useCallback(() => setShopPassword(''), []);

  const [optional_instructions, setOptionalInstructions] = useState('');
  const handleChangeOptionalInstructions = useCallback((newValue) => setOptionalInstructions(newValue), []);


  const [ descriptionPrice, setDescriptionPrice ] = useState( 5 );

  const [ totalDescriptionPrice, setTotalDescriptionPrice ] = useState(25);
  const [ totalMetaDescriptionPrice, setTotalMetaDescriptionPrice ] = useState(25);
  const [ totalBulletPointsPrice, setTotalBulletPointsPrice ] = useState(40);

  const [ totalCredit, setTotalCredit ] = useState( 5 );
  const [ totalPrice, setTotalPrice ] = useState(90);

  const [productsOpen, setProductsOpen] = useState(true);
  const handleProductsToggle = useCallback(() => {
    setProductsOpen((productsOpen) => !productsOpen)
  }, []);

  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const handleCollectionsToggle = useCallback(() => {
    setCollectionsOpen((collectionsOpen) => !collectionsOpen)
  }, []);

  const payWithShopify = () => {

    // Cart Content Validation START
    // console.log( 'cartItems', cartItems );
    if ( !cartItems.length && !collectionArr.length ) {
      return;
    }

    // Cart Content Validation END

    // Task Validation START
    let is_task_selected = 0;
    for ( var task_key in tasks ) {
      for (var i = 0; i < cartItems.length; i++) {
        var cartItem = cartItems[i];
        if ( cartItem.isDescriptionOrdered || cartItem.isMetaDescriptionOrdered || cartItem.areBulletPointsOrdered ) {
          ++is_task_selected;
        }
      }

      for (var i = 0; i < collectionArr.length; i++) {
        var cartItem = collectionArr[i];
        if ( cartItem.isDescriptionOrdered || cartItem.isMetaDescriptionOrdered ) {
          ++is_task_selected;
        }
      }
    }

    if ( !is_task_selected ) {
      return;
    }
    // Task Validation END

    // Get Total Price START
    let product_total_price = 0;let validate_task_count = 0;
    for (var s = 0; s < cartItems.length; s++) {

      if (cartItems[s].areBulletPointsOrdered) {
        product_total_price += bulletPoints;
      }
      if (cartItems[s].isMetaDescriptionOrdered) {
        product_total_price += metaDescription;
      }

      if ( cartItems[s].areBulletPointsOrdered || cartItems[s].isDescriptionOrdered || cartItems[s].isMetaDescriptionOrdered ) {
        validate_task_count += 1;
      }

      if (cartItems[s].isDescriptionOrdered) {

        const wordsNumberIntervalPr = cartItems[s].wordsNumberInterval;

        if ( cartItems[s].wordsNumberInterval === '100' ) {
          product_total_price += descriptionAmount[wordsNumberIntervalPr];
        }else if ( cartItems[s].wordsNumberInterval === '300' ) {
          product_total_price += descriptionAmount[wordsNumberIntervalPr];
        }else if ( cartItems[s].wordsNumberInterval === '500' ) {
          product_total_price += descriptionAmount[wordsNumberIntervalPr];
        }
      }

    }

    for (var s = 0; s < collectionArr.length; s++) {

      // if (collectionArr[s].areBulletPointsOrdered) {
      //   product_total_price += bulletPoints;
      // }
      if (collectionArr[s].isMetaDescriptionOrdered) {
        product_total_price += metaDescription;
      }

      if ( collectionArr[s].isDescriptionOrdered || collectionArr[s].isMetaDescriptionOrdered ) {
        validate_task_count += 1;
      }

      if (collectionArr[s].isDescriptionOrdered) {

        const wordsNumberInterval = collectionArr[s].wordsNumberInterval;

        if ( wordsNumberInterval === '100' ) {
          product_total_price += descriptionAmount[wordsNumberInterval];
        }else if ( wordsNumberInterval === '300' ) {
          product_total_price += descriptionAmount[wordsNumberInterval];
        }else if ( wordsNumberInterval === '500' ) {
          product_total_price += descriptionAmount[wordsNumberInterval];
        }
      }

    }

    let totalPrice = product_total_price;
    if (creditAmount !== 0 && creditAmount < product_total_price ) {
      totalPrice = product_total_price - creditAmount;
    }
    // Get Total Price END


    if (( cartItems.length + collectionArr.length) !== validate_task_count) {
      return;
    }

    if ( !task_title ) {
      setTaskTitleError( "Please enter a title for this task." )
      return;
    }

    const cartItemsArr = [...cartItems, ...collectionArr];

    setPayLoading( true );
    fetch(
      '/create_app_charge',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_title: task_title,
          optional_instructions: optional_instructions,
          shopPassword:shopPassword,
          total_price: totalPrice,
          creditAmount: creditAmount,
          cartItems: cartItemsArr
        })
      }
    ).then((res) => res.json()).then((data) => {
      // console.log( 'data', data );
      setPayLoading( false );
      if ( data.hasOwnProperty( 'application_charge' ) ) {
        if ( data.application_charge.hasOwnProperty( 'confirmation_url' ) ) {
          window.open(
            data.application_charge.confirmation_url,
            '_parent'
          );
        }
      }

    })

  }

  const changeCartItemTaskHandler = ( sourceId, newCheckedObj ) => {
    var cart_items_to_update = [];
    for ( var i = 0; i < cartItems.length; i++ ) {
      var cart_item = cartItems[i];
      if ( cart_item.sourceId == sourceId ) {
        cart_item = { ...cart_item, ...newCheckedObj };
      }
      cart_items_to_update.push(cart_item);
    }

    for ( var s = 0; s < collectionArr.length; s++ ) {
      var collection_item = collectionArr[s];
      if ( collection_item.sourceId == sourceId ) {
        collection_item = { ...collection_item, ...newCheckedObj };
      }
      cart_items_to_update.push(collection_item);
    }

    let filtered_products = cart_items_to_update.filter((cart) => {
      return cart.contentType == 'product';
    });

    let filtered_collections = cart_items_to_update.filter((cart) => {
      return cart.contentType == 'collection';
    });

    setCartItems( filtered_products );
    setCollectionArr( filtered_collections );

    // console.log('cart_items_to_update', cart_items_to_update);
  }

  let subtotal_price = 0;

  return (

      <Page
        fullWidth
        title="Cart"
        primaryAction={{
          content: 'Cart ('+ props.totalCartCount +')',
          icon: CartMajor,
          onAction: () => {
            props.setPage( '/cart' )
          }
        }}
      >
        <div className="cart-list">
          <Layout>
            <Layout.Section>
            {isLoading && <Loading />}
              { /* Products */ }
              {
                !!cartItems.length &&
                <div className="collapsible-card-wrap">
                  <Card>
                    <div className="ressource-list-header cart unselectable" onClick={handleProductsToggle}>
                      <TextContainer>
                        <Heading>Products</Heading>
                        <div className="tab-header-right">
                          <p className="tab-text">{cartItems.length} product(s) in your cart</p>
                          <Icon source={productsOpen ? ChevronUpMinor : ChevronDownMinor} />
                        </div>
                      </TextContainer>
                    </div>
                    <Collapsible
                      open={productsOpen}
                      id="products-collapsible"
                      transition={{duration: '150ms', timingFunction: 'ease'}}
                      expandOnPrint
                    >
                      <div className="cart-items">

                        <Card.Section>
                          {cartItems.map(( cartItem, key ) => {
                            return (
                              <RenderItem cartItem={cartItem} key={key} changeCartItemTask={changeCartItemTaskHandler} />
                            );
                          })}
                        </Card.Section>

                      </div>
                    </Collapsible>
                  </Card>

                </div>
              }

              { /* Collections */ }
              {
                !!collectionArr.length &&
                <div>
                  <Card>
                    <div className="ressource-list-header cart unselectable" onClick={handleCollectionsToggle}>
                      <TextContainer>
                        <Heading>Collections</Heading>
                        <div className="tab-header-right">
                          <p className="tab-text">{collectionArr.length} collection(s) in your cart</p>
                          <Icon source={collectionsOpen ? ChevronUpMinor : ChevronDownMinor} />
                        </div>
                      </TextContainer>
                    </div>
                    <Collapsible
                      open={collectionsOpen}
                      id="products-collapsible"
                      transition={{duration: '150ms', timingFunction: 'ease'}}
                      expandOnPrint
                    >
                      <div className="cart-items">

                        <Card.Section>
                          {collectionArr.map(( cartItem, key ) => {
                            return (
                              <RenderItem cartItem={cartItem} key={key} changeCartItemTask={changeCartItemTaskHandler} />
                            );
                          })}
                        </Card.Section>

                      </div>
                    </Collapsible>
                  </Card>

                </div>
              }

              { /* Blogs */ }

            </Layout.Section>

            <Layout.Section secondary>
              {
                (!!cartItems.length || !!collectionArr.length) &&
                <div className="cart-total-div">
                  <TextContainer>
                    <Heading>Cart Total</Heading>
                  </TextContainer>
                  <Card title="">

                    { /* Cart Item Products Section */ }
                    <div className="cart-item-section">
                      {
                        !!cartItems.length &&
                        <Card>
                          <Card.Header title="Products:">
                          </Card.Header>

                          {cartItems.map(( cartItem, key ) => {

                            let product_total_price = 0;

                            if (cartItem.areBulletPointsOrdered) {
                              product_total_price += bulletPoints;
                            }
                            if (cartItem.isMetaDescriptionOrdered) {
                              product_total_price += metaDescription;
                            }

                            if (cartItem.isDescriptionOrdered) {

                              const wordsNumberInterval = cartItem.wordsNumberInterval;


                              if ( wordsNumberInterval === '100' ) {
                                product_total_price += descriptionAmount[wordsNumberInterval];
                              }else if ( wordsNumberInterval === '300' ) {
                                product_total_price += descriptionAmount[wordsNumberInterval];
                              }else if ( wordsNumberInterval === '500' ) {
                                product_total_price += descriptionAmount[wordsNumberInterval];
                              }
                            }

                            subtotal_price += product_total_price;
                            // console.log(
                            //   "( !cartItem.isDescriptionOrdered && !cartItem.isMetaDescriptionOrdered && !cartItem.areBulletPointsOrdered )",
                            //   ( !cartItem.isDescriptionOrdered && !cartItem.isMetaDescriptionOrdered && !cartItem.areBulletPointsOrdered )
                            // );

                            return (
                              <Card.Section key={key}>
                                <TextContainer>
                                  <Heading>{cartItem.title}</Heading>
                                  {
                                    ( !cartItem.isDescriptionOrdered && !cartItem.isMetaDescriptionOrdered && !cartItem.areBulletPointsOrdered ) &&
                                    <InlineError message="Please select at least one task!" fieldID="myFieldID" />
                                  }
                                  {
                                    !!cartItem.isDescriptionOrdered && !!cartItem.wordsNumberInterval && (cartItem.wordsNumberInterval != "") &&
                                    <div className="description-wrap"><span className="description-wrap-description">{cartItem.wordsNumberInterval} words Description</span><span className="description-wrap-price"><span>${descriptionAmount[wordsNumberInterval]}</span></span></div>
                                  }
                                  {
                                    !!cartItem.isMetaDescriptionOrdered &&
                                    <div className="description-wrap"><span className="description-wrap-description">+ Meta Description</span><span className="description-wrap-price"><span>${metaDescription}</span></span></div>
                                  }
                                  {
                                    !!cartItem.areBulletPointsOrdered &&
                                    <div className="description-wrap"><span className="description-wrap-description">+ Bullet Points</span><span className="description-wrap-price"><span>${bulletPoints}</span></span></div>
                                  }
                                </TextContainer>
                              </Card.Section>
                            );
                          })}

                        </Card>
                      }
                      {
                        !!collectionArr.length &&
                        <Card>
                          <Card.Header title="Collections:">
                          </Card.Header>

                          {collectionArr.map(( cartItem, key ) => {

                            let product_total_price = 0;

                            // if (cartItem.areBulletPointsOrdered) {
                            //   product_total_price += bulletPoints;
                            // }
                            if (cartItem.isMetaDescriptionOrdered) {
                              product_total_price += metaDescription;
                            }

                            if (cartItem.isDescriptionOrdered) {

                              const wordsNumberInterval = cartItem.wordsNumberInterval;

                              if ( cartItem.wordsNumberInterval === '100' ) {
                                product_total_price += descriptionAmount[wordsNumberInterval];
                              }else if ( cartItem.wordsNumberInterval === '300' ) {
                                product_total_price += descriptionAmount[wordsNumberInterval];
                              }else if ( cartItem.wordsNumberInterval === '500' ) {
                                product_total_price += descriptionAmount[wordsNumberInterval];
                              }
                            }

                            subtotal_price += product_total_price;

                            return(
                              <Card.Section key={key}>
                                <TextContainer>
                                  <Heading>{cartItem.title}</Heading>
                                  {
                                    ( !cartItem.isDescriptionOrdered && !cartItem.isMetaDescriptionOrdered ) &&
                                    <InlineError message="Please select at least one task!" fieldID="myFieldID" />
                                  }
                                  {
                                    !!cartItem.isDescriptionOrdered && !!cartItem.wordsNumberInterval && (cartItem.wordsNumberInterval != "") &&
                                    <div className="description-wrap"><span className="description-wrap-description">{cartItem.wordsNumberInterval} words Description</span><span className="description-wrap-price"><span>${descriptionAmount[wordsNumberInterval]}</span></span></div>
                                  }
                                  {
                                    !!cartItem.isMetaDescriptionOrdered &&
                                    <div className="description-wrap"><span className="description-wrap-description">+ Meta Description</span><span className="description-wrap-price"><span>${metaDescription}</span></span></div>
                                  }
                                  {/*
                                    !!cartItem.areBulletPointsOrdered &&
                                    <span>+ Bullet Points</span>
                                  */}
                                </TextContainer>
                              </Card.Section>
                            );

                          })}

                        </Card>
                      }
                    </div>


                    {(creditAmount < subtotal_price && creditAmount !== 0) && <div className="cart-item-total cart-item-sub-total">
                      <Card>
                        <Card.Section>
                          <TextContainer>
                            <Heading>Subtotal</Heading>
                            <span>${subtotal_price}</span>
                          </TextContainer>
                          <TextContainer>
                            <Heading>Credit</Heading>
                            <span>{`$${creditAmount}`}</span>
                          </TextContainer>
                        </Card.Section>
                      </Card>
                    </div>}


                    {
                      totalCredit && ( !!tasks.description || !!tasks.meta_description || !!tasks.bullet_points ) && <div className="cart-item-total">
                        <Card>
                          <Card.Section>
                            <TextStyle variation="subdued">Credit Applied: </TextStyle>
                            <Stack vertical={true} wrap={true} alignment="trailing">
                              <TextStyle variation="subdued"> -${totalCredit}</TextStyle>
                            </Stack>
                          </Card.Section>
                        </Card>
                      </div>
                    }


                    <Card.Section>
                      <Stack distribution="trailing">
                        <ButtonGroup>
                          <Heading>Total</Heading>
                          <Heading>${(subtotal_price > creditAmount && creditAmount !== 0) ? (subtotal_price - creditAmount) : subtotal_price}</Heading>
                        </ButtonGroup>
                      </Stack>
                    </Card.Section>


                    <Card.Section>
                      <div className="card-input-wrap">
                        <TextField
                          label="Task title"
                          value={task_title}
                          onChange={handleChangeTaskTitle}
                          placeholder="Title to identify this task (required)"
                          autoComplete="off"
                          clearButton={true}
                          onClearButtonClick={handleClearButtonClickTaskTitle}
                          requiredIndicator={true}
                          error={task_title_error}
                          focused={true}
                        />
                      </div>
                      <div className="card-input-wrap">
                        <TextField
                          label="Shop password"
                          value={shopPassword}
                          onChange={handleChangeShopPass}
                          placeholder="Provide the password to visitors to let them access your store."
                          autoComplete="off"
                          clearButton={true}
                          onClearButtonClick={handleClearButtonClickShopPass}
                          focused={true}
                        />
                      </div>
                      <div className="card-input-wrap">
                        <TextField
                          label="Optional instructions"
                          value={optional_instructions}
                          onChange={handleChangeOptionalInstructions}
                          multiline={4}
                          placeholder="Any instructions for writers. Target audience or Tone. (optional)"
                          autoComplete="off"
                        />
                      </div>
                    </Card.Section>


                    <div className="cart-item-total">
                      <Card.Section>
                        <Button fullWidth icon={CreditCardMajor} loading={payLoading} onClick={payWithShopify} size="large">{!payLoading ? 'Pay with Shopify' : ''}</Button>
                      </Card.Section>
                    </div>

                  </Card>
                </div>
              }

            </Layout.Section>
          </Layout>
        </div>
      </Page>

  );
};

export default CartPage;
