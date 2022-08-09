import {
  useState,
  useCallback,
  useEffect
} from "react";

import {
  Page,
  Layout,
  Frame,
  Navigation,
  Card,
  TextField,
  Icon,
  Loading,
  SkeletonPage,
  TextContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  Heading,
  Button,
  Toast,
  DisplayText,
  DataTable,
  Tabs,
  TextStyle,
  ButtonGroup,
  useIndexResourceState
} from "@shopify/polaris";

import {
  HomeMajor,
  CartMajor,
  ProductsMajor,
  CollectionsMajor,
  BlogMajor,
  ChevronUpMinor,
  ChevronDownMinor,
  MobileHamburgerMajor,
  ViewMajor,
  RefreshMajor,
  TickMinor
} from '@shopify/polaris-icons';


import ProductsPageMarkup from './products';
import DashboardMarkup from './dashboard';
import CartPageMarkup from './cart';
import CollectionsPageMarkup from './collections';
import PendingValidationPageMarkup from './pending_validation';
import SupportPage from './support';
import DocumentationPage from './documentation';
import CustomAccordion from '../components/customaccordion';

const loadingPageMarkup = (
  <SkeletonPage>
    <Layout>
      <Layout.Section>
        <Card sectioned>
          <TextContainer>
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={9} />
          </TextContainer>
        </Card>
      </Layout.Section>
    </Layout>
  </SkeletonPage>
);

const Index = () => {

  useEffect(() => {

  }, [])

  const [page, setPage] = useState('/')
  const [totalCartCount, setTotalCartCount] = useState(0)
  const items = [
    {
      url: '/',
      label: 'Dashboard',
      icon: HomeMajor,
      onClick: (e) => { setPage('/') },
      exactMatch: true
    },
    {
      url: '/products',
      label: 'Products',
      icon: ProductsMajor,
      onClick: (e) => { setPage('/products') },
      exactMatch: true
    },
    {
      url: '/collections',
      label: 'Collections',
      icon: CollectionsMajor,
      onClick: (e) => { setPage('/collections') },
      exactMatch: true
    },
    {
      url: '/pending_validation',
      label: 'Pending Validation',
      icon: TickMinor,
      onClick: (e) => { setPage('/pending_validation') },
      exactMatch: true
    }
  ];

  const NavigationMarkup = (
    <Navigation location={page}>
      <Navigation.Section
        title="Product Description App"
        items={items}
      />
    </Navigation>
  );

  const [selected, setSelected] = useState(0);

  const handleTabChange = (index) => {
    setSelected(index);
    setPage(tabs[index].page);
  }

  const tabs = [
    {
      id: 'all-customers-1',
      content: 'Application',
      accessibilityLabel: 'Application',
      panelID: 'all-customers-content-1',
      page: '/'

    },
    {
      id: 'accepts-marketing-1',
      content: 'Documentation',
      panelID: 'accepts-marketing-content-1',
      page: '/documentation'
    },
    {
      id: 'repeat-customers-1',
      content: 'Support',
      panelID: 'repeat-customers-content-1',
      page: '/support'
    },
  ];

  let PageMarkup = DashboardMarkup;

  switch (page) {
    case '/':
      PageMarkup = DashboardMarkup;
      break;
    case '/products':
      PageMarkup = ProductsPageMarkup;
      break;
    case '/collections':
      PageMarkup = CollectionsPageMarkup;
      break;
    case '/pending_validation':
      PageMarkup = PendingValidationPageMarkup;
      break;
    case '/cart':
      PageMarkup = CartPageMarkup;
      break;
    case '/documentation':
      PageMarkup = DocumentationPage;
      break;
    case '/support':
      PageMarkup = SupportPage;
      break;
    default:
      PageMarkup = DashboardMarkup;
      break;
  }

  return (
    <div className="navigation-wrap-tabs-parent">
      <Card>
        <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
          <Card>
            {tabs[selected].page == '/' && <Frame navigation={NavigationMarkup}>
              <PageMarkup setPage={setPage} setTotalCartCount={setTotalCartCount} totalCartCount={totalCartCount}/>
            </Frame>}
            {tabs[selected].page !== '/' && <PageMarkup setPage={setPage} setTotalCartCount={setTotalCartCount} totalCartCount={totalCartCount}/>}
          </Card>
        </Tabs>
      </Card>
    </div>
  );

};

export default Index;
