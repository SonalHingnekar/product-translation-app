import {
  useState,
  useCallback,
  useEffect
} from "react";

import { Card, TextContainer, Icon, Heading, Collapsible } from "@shopify/polaris";

import { ChevronUpMinor, ChevronDownMinor } from '@shopify/polaris-icons';


const CustomAccordion = (props) => {
  const [productsOpen, setProductsOpen] = useState(true);
  const handleProductsToggle = useCallback(() => {
    setProductsOpen((productsOpen) => !productsOpen)
  }, []);

  return (
    <Card>
      <div className="ressource-list-header cart unselectable" onClick={handleProductsToggle}>
        <TextContainer>
          <Heading>{`${props.accordionTitle} ${props.accordionIndex}`}</Heading>
          <div className="tab-header-right">
            {props.productCount && <p className="tab-text">{props.productCount} product(s) in your order</p>}
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
      {props.children}
      </Collapsible>
    </Card>
  );
};

export default CustomAccordion;
