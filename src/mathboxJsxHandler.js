const babel = require('babel-core');

// import {babel} from 'babel-core'; // having issues with this...
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import scriptHandler from './scriptHandler';

scriptHandler('mathbox/jsx', (text, script) => {
  console.log('mathbox/jsx', text);
  const mathbox = mathBox({
          element: script.parentNode,
          plugins: ['core', 'controls', 'cursor', 'stats'],
          controls: {
            klass: THREE.OrbitControls
          },
        }),
        three = mathbox.three;

  let root;
  const React = { // react-jsx transform expects `React` to exist when the code is eval`d...
    // We'll just assemble our VDOM-like here.
    createElement: function(name, props) {
      root = {name: name, props: props};

      if (arguments.length > 2) root.children = Array.prototype.slice.call(arguments, 2);

      return root;
    }
  };

  const transformed = babel.transform(text, {presets: [es2015], plugins: [transformReactJsx]});

  const result = eval(transformed.code) || {},
        controls = result.controls,
        commands = result.commands;

  console.log(result);


  const view = build(mathbox, root);

  (result.onMathBoxViewBuilt || set)(view, controls, commands);

  function set(view, controls, commands) {
    console.log('set', view, controls, commands);
    if (controls === undefined || commands === undefined) return;

    const actionHandler = generateActionHandler(controls, define(commands));

    view._context.canvas.parentElement.addEventListener('mousedown', function(event){ view._context.canvas.parentElement.focus(); });
    window.addEventListener('keydown', function(event) { event.target === view._context.canvas.parentElement ? actionHandler(event.keyCode) : console.log(event, view); }); // this is a bit problematic...binding to global event, multiple timess

    function generateActionHandler(controls, commands) {
      console.log(controls, commands);
      const actions = controls.reduce(function(actions, commandLike) {
          const keys = commandLike[0],
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
        for (let name in command) {
          const props = command[name];

          if (typeof props === 'function') props(view); // not sure what, if anything, should be passed in here
          else {
            const element = view.select(name);

            for (let propName in props) {
              const action = props[propName],
                    propValue = element.get(propName);

              if (typeof action === 'function') element.set(propName, action(propValue));
              else {
                const parameters = [propValue];

                for (let i = 0; i < action.length - 1; i++) parameters.push(element.get(action[i]));
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
    const name = node.name,
        props = node.props;

    if (name !== 'root') {
      let props1 = {}, props2;

      for (let propName in props) {
        const prop = props[propName];

        if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
        else (props1 = (props1 || {}))[propName] = prop;
      }

      view = view[name](props1, props2);
    }

    (node.children || []).forEach(buildChildView);

    return view;

    function buildChildView(child) { return build(view, child); }
  }
});