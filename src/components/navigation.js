import {
  useState,
  useCallback
} from "react";
import { Navigation } from "@shopify/polaris";
import { HomeMajor, ProductsMajor } from '@shopify/polaris-icons';



let items = [
  {
    url: '/',
    label: 'Overview',
    icon: HomeMajor,
    // onClick: toggleIsLoading,
  },
  {
    url: '/products',
    label: 'Products',
    icon: ProductsMajor,
    // onClick: () => {
    //   console.log( 'clicked', this );
    // },
  },
];

const NavigationMarkup = (
  <Navigation location="/">
    <Navigation.Section
      separator
      title="Product Description App"
      items={items}
    />
  </Navigation>
);


export default NavigationMarkup;
