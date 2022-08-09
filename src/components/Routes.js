import React from 'react';
import { Switch, Route, withRouter } from 'react-router';
import { ClientRouter, RoutePropagator } from '@shopify/app-bridge-react';

import Overview from '../pages/overview';
import Products from '../pages/products';

function Routes( props ) {

  const { history, location } = props;

  return (
    <div>
      <ClientRouter history={history} />
      <RoutePropagator location={location} />
      <Switch>
        <Route path="/">
          <Overview />
        </Route>
        <Route path="/products">
          <Products />
        </Route>
      </Switch>
    </div>
  );
};

// export default Routes;
export default withRouter(Routes);
