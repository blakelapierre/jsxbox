var scriptHandler = require('./scriptHandler');

var babel = require('babel-core');
var es2015 = require('babel-preset-es2015');
var transformReactJsx = require('babel-plugin-transform-react-jsx');

scriptHandler('mathbox/jsx', function(text, script) {
  var transformed = babel.transform(text, {presets: [es2015], plugins: [transformReactJsx]});

  var root,
      React = {
        createElement: function(name, props) {
          root = {name: name, props: props};

          if (arguments.length > 2) root.children = Array.prototype.slice.call(arguments, 2);

          return root;
        }
      };

  var result = eval(transformed.code),
      controls = result.controls,
      commands = result.commands;

  console.log(result);


  var view = build(mathBox({
    element: script.parentNode,
    plugins: ['core', 'controls', 'cursor', 'stats'],
    controls: {
      klass: THREE.OrbitControls
    },
  }), root);

  (result.onMathBoxViewBuilt || set)(view, controls, commands);

  function set(view, controls, commands) {
    console.log('set', view, controls, commands);
    if (controls === undefined || commands === undefined) return;

    var actionHandler = generateActionHandler(controls, define(commands));

    view._context.canvas.parentElement.addEventListener('mousedown', function(event){ view._context.canvas.parentElement.focus(); });
    window.addEventListener('keydown', function(event) { event.target === view._context.canvas.parentElement ? actionHandler(event.keyCode) : console.log(event, view); }); // this is a bit problematic...binding to global event, multiple timess

    function generateActionHandler(controls, commands) {
      console.log(controls, commands);
      var actions = controls.reduce(function(actions, commandLike) {
          var keys = commandLike[0],
              command = commandLike[1];

          (typeof keys === 'number' ? [keys] : keys).forEach(function(key) { actions[key] = command; });
          return actions;
        }, {});

      return function(keyCode) { return run(commands[actions[keyCode]]); };
    }

    function run(command) {
      console.log('command', command);
      if (typeof command === 'function') command(view);
      else {
        for (var name in command) {
          var props = command[name];

          if (typeof props === 'function') props(view); // not sure what, if anything, should be passed in here
          else {
            var element = view.select(name);

            for (var propName in props) {
              var action = props[propName],
                    propValue = element.get(propName);

              if (typeof action === 'function') element.set(propName, action(propValue));
              else {
                var parameters = [propValue];
                var i = 0;
                for (; i < action.length - 1; i++) parameters.push(element.get(action[i]));
                element.set(propName, action[i].apply(undefined, parameters));
              }
            }
          }
        }
      }
    }

    function define(commands) {
      //may want to do something fancier here, perhaps there are things in `run` that could be pre-cached?
      return commands;
    }
  }



  window.view = view;

  function build(view, node) {
    var name = node.name,
        props = node.props;

    if (name !== 'root') {
      var props1 = {}, props2;

      for (var propName in props) {
        var prop = props[propName];

        if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
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