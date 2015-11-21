var scriptHandler = require('./scriptHandler');

var babel = require('babel-core');
var es2015 = require('babel-preset-es2015');
var transformReactJsx = require('babel-plugin-transform-react-jsx');

scriptHandler('mathbox/jsx', function(text) {
  console.log('mathbox stuff', text);
  var result = babel.transform(text, {presets: [es2015], plugins: [transformReactJsx]});

  var root,
      React = {
        createElement: function(name, props) {
          var children;
          if (arguments.length > 2) children = Array.prototype.slice.call(arguments, 2);

          console.log('create', name, props, children, arguments);

          var element = {name: name, props: props, children: children};

          root = element;

          return element;
        }
      };
console.log(result);
  eval(result.code);

  build(mathBox({
    plugins: ['core', 'controls', 'cursor', 'stats'],
    controls: {
      klass: THREE.OrbitControls
    },
  }), root);

  function build(view, node) {
    var name = node.name,
        props = node.props;

    if (name !== 'root') {
      console.log(name);
      view = view[name](props);
    }

    (node.children || []).forEach(function(child) {
      build(view, child);
    });
  }
});