import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import scriptHandler from './scriptHandler';

scriptHandler('mathbox/jsx', (text, script) => {
  const mathbox = mathBox({
          element: script.parentNode,
          plugins: ['core', 'controls', 'cursor', 'stats'],
          controls: {
            klass: THREE.OrbitControls
          },
        }),
        {three} = mathbox;

  let root;
  const JMB = {
    // We'll just assemble our VDOM-like here.
    createElement: (name, props, ...rest) => {
      root = {name, props};

      root.children = rest;

      return root;
    }
  };

  const transformed = transform(text, {
    presets: [es2015],
    plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
  });

  const result = eval(transformed.code) || {},
        {commands, controls, onMathBoxViewBuilt} = result;

  const view = build(mathbox, root);

  (onMathBoxViewBuilt || set)(view, controls, commands);

  function set(view, controls, commands) {
    if (controls === undefined || commands === undefined) return;

    addListeners(generateActionHandler(controls, define(commands)));

    function addListeners(actionHandler) {
      const box = view._context.canvas.parentElement;
      focusOn(box, 'mousedown');

      window.addEventListener('keydown', // this is a bit problematic...binding to global event, multiple timess
        event => event.target === box ? actionHandler(event.keyCode)
                                      : console.log(event, view));

      function focusOn(el, eventName) { return el.addEventListener(eventName, () => el.focus()); }
    }

    function generateActionHandler(controls, commands) {
      const actions = buildActions();

      console.log('actions', actions);

      return keyCode => (actions[keyCode] || noActionHandler)(view, keyCode);

      function buildActions() {
        return controls.reduce((actions, [keys, commandName]) => {
          (typeof keys === 'number' ? [keys] : keys).forEach(setAction);

          return actions;

          function setAction(key) { actions[typeof key === 'number' ? key : key.charCodeAt(0)] = commands[commandName]; }
        }, {});
      }

      function noActionHandler(view, keyCode) { console.log(`No action for ${keyCode} on ${view}`); }
    }


    function define(commands) {
      for (let commandName in commands) commands[commandName] = process(commandName, commands[commandName]);

      return commands;

      function process(commandName, command) {
        return typeof command === 'function' ? command : multipleProps;

        function multipleProps(view, keyCode) { // shouldn't be keycode here...
          for (let name in command) {
            const props = command[name],
                  element = proxied(view.select(name));
            for (let propName in props) updateProp(propName, props[propName], element);
          }
        }

        function updateProp(propName, action, {get, set}) {
          set(propName, getNewValue(get(propName)));

          function getNewValue(propValue) {
            return typeof action === 'function' ? action(propValue) : getComplexPropValue(propValue);
          }

          function getComplexPropValue(propValue) {
            const {length} = action,
                  fnIndex = length - 1,
                  fn = action[fnIndex],
                  dependencies = action.slice(0, fnIndex).map(get),
                  parameters = [propValue, ...dependencies];

            return fn.apply(undefined, parameters);
          }
        }
      }

      for (let name in commands)
      //may want to do something fancier here, perhaps there are things in `run` that could be pre-cached?
      return commands;
    }
  }

  function proxied(obj) {
    return {
      get: (...args) => obj.get.apply(obj, args),
      set: (...args) => obj.set.apply(obj, args)
    };
  }



  window.view = view;

  function build(view, node) {
    const {name, props} = node;

    if (name !== 'root') {
      let props1 = {}, props2;

      for (let propName in props) {
        const prop = props[propName];

        if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
        else (props1 = (props1 || {}))[propName] = prop;
      }

      view = view[name](props1, props2);
    }

    (node.children || []).forEach(child => build(view, child));

    return view;
  }
});