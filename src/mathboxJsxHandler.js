import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import scriptHandler from './scriptHandler';

let boxes = [];

scriptHandler('mathbox/jsx', (text, script) => {
  const {view, result, root} = handleMathBoxJsx(text, script.parentNode),
        {commands, controls, onMathBoxViewBuilt} = result;

  build(view, root);

  window.view = view;

  (onMathBoxViewBuilt || set)(view, controls, commands);

  function set(view, controls, commands) {
    if (controls === undefined || commands === undefined) return;

    addListeners(generateActionHandler(controls, define(commands)));

    function define(commands) {
      return mapValues(commands, process);

      function process(commandName, command) {
        return typeof command === 'function' ? command : multipleProps;

        function multipleProps(view, keyCode) { // shouldn't be keycode here...
          for (let name in command) runCommand(name, command);

          function runCommand(name, command) {
            const props = command[name],
                  element = proxied(view.select(name));
            for (let propName in props) updateProp(propName, props[propName], element);
          }
        }
      }

      function updateProp(propName, action, {get, set}) {
        let isComplex = action !== 'function',
            getNewValue = isComplex ? getComplexPropValue : action;

        set(propName, getNewValue(get(propName)));

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

    function generateActionHandler(controls, commands) {
      const actions = buildActions(controls, commands);

      return keyCode => (actions[keyCode] || noActionHandler)(view, keyCode);

      function buildActions(controls, commands) {
        return controls.reduce((actions, [keys, commandName]) => {
          (typeof keys === 'number' ? [keys] : keys).forEach(setAction);

          return actions;

          function setAction(key) { actions[typeof key === 'number' ? key : key.charCodeAt(0)] = commands[commandName]; }
        }, {});
      }

      function noActionHandler(view, keyCode) { console.log(`No action for ${keyCode} on ${view}`); }
    }

    function addListeners(actionHandler) {
      const box = view._context.canvas.parentElement;
      focusOn(box, 'mousedown');

      if (boxes.length === 0) window.addEventListener('keydown', windowKeydownListener);

      boxes.push({box, actionHandler});

      // window.addEventListener('keydown', // this is a bit problematic...binding to global event, multiple timess
      //   event => event.target === box ? actionHandler(event.keyCode)
      //                                 : console.log(event, view));

      function focusOn(el, eventName) { return el.addEventListener(eventName, () => el.focus()); }
    }
  }

  function proxied(obj) {
    return {
      get: (...args) => obj.get.apply(obj, args),
      set: (...args) => obj.set.apply(obj, args)
    };
  }

  function mapValues(obj, t) {
    const ret = {};
    for (let name in obj) ret[name] = t(name, obj[name]);
    return ret;
  }

  function windowKeydownListener(event) {
    const {length} = boxes,
          {target} = event;

    console.log(event);

    for (let i = 0; i < length; i++) {
      const {box, actionHandler} = boxes[i]; // don't need to pull actionHandler out here for most cases
      console.log(i, target, box, target === box, actionHandler);
      if (target === box) {
        actionHandler(event.keyCode);
        return;
      }
    }

    console.log('no handler', event, boxes);
  }
});

function handleMathBoxJsx(code, parentNode) { //get rid of parentNode
  const {result, root} = runMathBoxJsx(compile(code).code),
        {attachTo, cameraControls, editorPanel, plugins} = result,
        element = attachTo || parentNode;

  const view = mathBox({
    element,
    plugins: plugins || ['core', 'cursor', 'stats'],
    controls: {
      klass: cameraControls || THREE.OrbitControls
    },
  });

  if (editorPanel) attachPanel(element, root);

  console.log(root);

  return {view, result, root}; // possibly dangerous semantics...

  function runMathBoxJsx(code) {
    let root;
    const JMB = {
      // We'll just assemble our VDOM-like here.
      createElement: (name, props, ...rest) => {
        root = {name, props};

        root.children = rest;

        return root;
      }
    };

    const result = eval(code) || {};

    return {result, root};
  }

  function attachPanel(element, currentRoot) {
    const panel = document.createElement('div');

    panel.className = 'editor-panel hidden';

    panel.innerText = code;

    panel.contentEditable = true;

    panel.addEventListener('keyup', update);

    element.appendChild(panel);

    function update(event) {
      try {
        const code = panel.innerText,
              {result, root} = runMathBoxJsx(compile(code).code);

        view.remove('*');
        build(view, root);
        console.log({result, currentRoot, root});
       // patch(view, diff(currentRoot, root));
      }
      catch (e) {
        console.log('Failed to update', e);
      }
    }
  }
}

function compile(text) {
  return transform(text, {
    presets: [es2015],
    plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
  });
}

function build(view, node) {
  const {name, children} = node;

  if (name !== 'root') handleChild(node);

  (children || []).forEach(child => build(view, child));

  return view;

  function handleChild({name, props}) {
    let props1 = {}, props2;

    for (let propName in props) handleProp(propName, props[propName]);

    view = view[name](props1, props2);

    function handleProp(propName, prop) {
      if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
      else (props1 = (props1 || {}))[propName] = prop;
    }
  }
}

function diff(oldObj, newObj) {
  console.log('diffing', oldObj, newObj);

  const oo = prep(oldObj),
        no = prep(newObj),
        changedKeys = difference(oo, no);


  console.log({changedKeys});



  // check for removals
  // check for adds
  // check adds to see if they contain a removed, if so, mark as moved
  return changedKeys;

  function prep(obj = {}) {
    return {keys: Object.keys(obj), obj};
  }

  function difference(oo, no) {
    const oldKeys = oo.keys.sort(),
          newKeys = no.keys.sort(),
          removedKeys = differenceSortedList1FromSortedList2(oldKeys, newKeys),
          addedKeys = differenceSortedList1FromSortedList2(newKeys, oldKeys),
          keysToCheck = differenceSortedList1FromSortedList2(differenceSortedList1FromSortedList2(newKeys, removedKeys), addedKeys),
          modifiedKeys = modifications(keysToCheck, oo.obj, no.obj);


    return {addedKeys, modifiedKeys, removedKeys};
  }

  function differenceSortedList1FromSortedList2(l1, l2) {
    const d = [];

    let j = 0,
        item2 = l2[j];
    for (let i = 0; i < l1.length; i++) {
      const item1 = l1[i];

      if (item1 !== item2) d.push(item1);
      else item2 = l2[++j];
    }

    // for (; j < l2.length; j++) d.push(l2[j]);

    return d;
  }

  function totalDifferenceOfSortedLists(l1, l2) {
    const d = [];

    let j = 0,
        item2 = l2[j];
    for (let i = 0; i < l1.length; i++) {
      const item1 = l1[i];

      if (item1 !== item2) d.push(item1);
      else item2 = l2[++j];
    }

    for (; j < l2.length; j++) d.push(l2[j]);

    return d;
  }

  function modifications(keysToCheck, oldObj, newObj) {
    const m = [];

    keysToCheck.forEach(key => (newObj[key] !== oldObj[key]) ? m.push(key) : undefined);

    return m;
  }
}

function patch(view, changes) {
  changes.forEach(applyToView);

  function applyToView(change) {
    const {type} = change;

    switch(type) {
      case 'remove': remove(view, change); break;
      case 'add': add(view, change); break;
      case 'move': move(view, change); break;
      case 'modify': modify(view, change); break;
    }

    function remove(view, change) {

    }

    function add(view, change) {

    }

    function move(view, change) {

    }

    function modify(view, change) {

    }

    function walkPath(view, path) {
      // should return the element selected by path
    }
  }
}

const obj1 = {
        // name: 'root',
        props: null,
        children: [{
          name: 'camera',
          props: {lookAt: [0, 0, 0]}
        }]
      },
      obj2 = {
        name: 'root',
        children: []
      };

diff(obj1, obj2);