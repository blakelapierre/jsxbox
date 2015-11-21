var scriptHandler = require('./scriptHandler');

var babel = require('babel-core');
var es2015 = require('babel-preset-es2015');

scriptHandler('application/es2015', function(text) {
  var result = babel.transform(text, {presets: [es2015]});

  eval(result.code);
});