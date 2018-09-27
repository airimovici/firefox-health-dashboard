import React from 'react';
import renderer from 'react-test-renderer';
import NimbledroidSiteDrilldown from '../../src/containers/NimbledroidSummaryTable';

const nimbledroidData = require('../mocks/nimbledroidData.json');

it('renders correctly', () => {
  const tree = renderer
    .create((
      <NimbledroidSiteDrilldown
        nimbledroidData={nimbledroidData}
        configuration={{
          baseProduct: 'org.mozilla.focus',
          compareProduct: 'com.chrome.beta',
          products: [
            'org.mozilla.klar',
            'org.mozilla.focus',
            'com.chrome.beta',
          ],
          site: 'reddit.com',
          targetRatio: 1.2,
        }}
      />
    ))
    .toJSON();
  expect(tree).toMatchSnapshot();
});