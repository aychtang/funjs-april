var Rx = require('rx');
var _ = require('highland');
var $ = require('jquery');
var reqwest = require('reqwest');
var CAPI_KEY = "funjs-reactive";

// Returns a Promise of the response
// See http://explorer.content.guardianapis.com/#/
// for API docs
function searchContentApi(query, limit) {
  return reqwest({
    url: 'http://content.guardianapis.com/search',
    type: 'jsonp',
    data: {
      'q':         query,
      'page-size': limit,
      'api-key':   CAPI_KEY,
      'show-fields': 'headline'
    }
  });
}


/* TODO: Instructions / Ideas:
 *
 * 1. Show the current query in the UI ('.q-display')
 * 2. Filter out queries of two characters or less
 * 3. Throttle the query to run at most once a second
 * 4. Run the query against the Content API (see helper function
 *    above)
 * 5. Display matched headlines in the 'results' list, as links to the
 *    original article
 * 6. Use 'limit' dropdown to customize the number of results
 * 7. Highlight the query in the matched headlines (if found)
 * 8. Allow disabling find-as-you-type behaviour using checkbox;
 *    if disabled, only search when the Search button is pressed
 * 9. Update the URL of the page to include ?q=<query> as the user
 *    updates the query
 */

var input = $('.q');
var limitEl = $('.limit');
var resultsEl = document.querySelector('.results');
var lastQuery;
var lastLimit = 5;

var render = function(items) {
  resultsEl.innerHTML = '';
  _(items).each(function(e) {
    resultsEl.innerHTML += '<li><a href="' + e.webUrl + '">' + e.fields.headline + '</a></li>';
  });
};

var limitAmounts = _('change', limitEl)
  .map(function(e) {
    return ['limits', e.target.value];
  });

var queries = _('keyup', input)
  .map(function(e) {
    return ['queries', e.target.value];
  })
  .filter(function(e) {
    return e[1].length > 2;
  })
  .throttle(1000)
  .latest();

var results = _([limitAmounts, queries])
  .merge()
  .map(function(e) {
  if (e[0] === 'limits') {
    lastLimit = e[1];
  }
  else {
    lastQuery = e[1];
  }

  return searchContentApi(lastQuery, +lastLimit);
});

var data = results
  .flatMap(function(e) {
    return _(e);
  })
  .map(function(e) {
    return e.response.results;
  });

data.each(render);
