// AppFrame.js
import React from "react";
import { Frame, Navigation } from "@shopify/polaris";
import { HomeMajor, NoteMajor, ProductsMajor } from '@shopify/polaris-icons';

function AppFrame() {

  return (
    <Frame
      navigation={
        <Navigation location="/">
          <Navigation.Section
            title="Product Content App"
            items={[
              {
                url: '/',
                label: 'Overview',
                icon: HomeMajor,
              },
              {
                url: '/products',
                label: 'Products',
                icon: ProductsMajor,
              }
            ]}
          />
        </Navigation>
      }
      showMobileNavigation={true}
    >
    </Frame>
  );
}

export default AppFrame;
