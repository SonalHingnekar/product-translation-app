import {
  useEffect
} from "react";

import {
  Page,
  Layout,
  Card,
  Heading,
  ButtonGroup,
  Button,
  TextStyle
} from "@shopify/polaris";

const DocumentationPage = () => {

  useEffect(() => {

  }, []);

  return (
    <Page fullWidth title="Documentation">
      <Layout>
        <Layout.Section oneThird>
          <div className="documentation-text">
            <div className="documentation-text-second-wrap">
              <div className="documentation-text-layout-wrap">
                <Layout>
                  <Layout.AnnotatedSection
                    title="Order a text"
                  >
                  <Card>
                    <Card.Section>
                      <div>
                        <div>
                          <p> 1. Go on the <b>Products</b> or <b>Collections</b> section. </p>
                          <p> 2. Select the products or collections you want to describe. </p>
                          <p> 3. Click on <b>Add to the cart</b> button. </p>
                          <p> 4. Go to the <b>Cart</b> page. </p>
                          <p> 5. Fill in the boxes and informations for each selected product: </p>
                          <ul>
                            <li>Meta title</li>
                            <li>Meta description</li>
                            <li>How much words do you want ?</li>
                            <li>Bullet points</li>
                          </ul> <br></br>
                          <p> 6. Verify your order and click on <b>Pay with Shopify</b>. </p>
                          <p> <br></br> <i> Your order has been received. Processing takes between 3 and 75 days. </i> </p> <br></br>
                        </div>
                      </div>
                    </Card.Section>
                  </Card>
                  </Layout.AnnotatedSection>
                  <Layout.AnnotatedSection
                    title="Validate your order"
                  >
                    <Card>
                      <Card.Section>
                        <div>
                          <div>
                            <p> 1. Go to the <b>Pending Validation</b> section. </p>
                            <p> 2. Check the content delivered in the editor: <br></br> </p>
                            <p> if it's good for you, you can click on the <b>Validate</b> button. </p>
                            <p>&nbsp;&nbsp;&nbsp; or&nbsp;&nbsp;&nbsp;</p>
                            <p> Add a comment in the comments section and press the <b>Send Back</b> button. <br></br> </p>
                            <p> 3. You will receive an email when the changes have been made. </p>
                          </div>
                        </div>
                      </Card.Section>
                    </Card>
                  </Layout.AnnotatedSection>
                  <Layout.AnnotatedSection
                    title="Dashboard"
                  >
                    <Card>
                      <Card.Section>
                        <div>
                          <div>
                            <p> <b>Submitted tasks</b>: The number of orders placed per month. </p>
                            <p> <b>Amount Spent:</b> Your amounts spent per month. </p>
                            <hr></hr>
                            <p> <b>Last Orders</b>: The summary of all your orders with the status. <br></br> <br></br> </p>
                            <p>Status details:</p> <b>IN_PROGRESS</b>: Your item is being processed. <br></br> <b>PENDING_APPROVAL</b>: Your writing has been delivered, you must validate it in <b>Pending Validation</b> section. <br></br> <b>IN_REVIEW</b>: Your
                            item is currently being modified by the editor. <br></br> <b>APPROVED</b>: Your text is online <br></br>
                            <p></p>
                          </div>
                        </div>
                      </Card.Section>
                    </Card>
                  </Layout.AnnotatedSection>
                </Layout>
              </div>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default DocumentationPage;
