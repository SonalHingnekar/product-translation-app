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

const SupportPage = () => {

  useEffect(() => {

  }, []);

  return (
    <Page fullWidth title="Support">
      <Layout>
        <Layout.Section>
          <p>Have a question regarding our apps & services? Please contact us support@varoadvisors.com</p>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default SupportPage;
