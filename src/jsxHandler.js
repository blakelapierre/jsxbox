var scriptHandler = require('./scriptHandler');

var babel = require('babel-core');
var es2015 = require('babel-preset-es2015');
var transformReactJsx = require('babel-plugin-transform-react-jsx');

scriptHandler('mathbox/jsx', function(text, script) {
  var result = babel.transform(text, {presets: [es2015], plugins: [transformReactJsx]});

  var root,
      React = {
        createElement: function(name, props) {
          root = {name: name, props: props};

          if (arguments.length > 2) root.children = Array.prototype.slice.call(arguments, 2);

          return root;
        }
      };

  eval(result.code);

  var view = build(mathBox({
    element: script.parentNode,
    plugins: ['core', 'controls', 'cursor', 'stats'],
    controls: {
      klass: THREE.OrbitControls
    },
  }), root);

  (window.onMathBoxViewBuilt || function() {})(view);

  window.view = view;

  function build(view, node) {
    var name = node.name,
        props = node.props;

    if (name !== 'root') {
      var props1 = {}, props2;

      for (var propName in props) {
        var prop = props[propName];

        if (name === 'camera' && typeof prop === 'function') (props2 = (props2 || {}))[propName] = prop;
        else (props1 = (props1 || {}))[propName] = prop;
      }

      view = view[name](props1, props2);
    }

    (node.children || []).forEach(function(child) {
      build(view, child);
    });

    return view;
  }
});