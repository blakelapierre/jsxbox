import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import attachControls from './attachControls';
import debounce from './debounce';
import unindent from './unindent';
import scriptHandler from './scriptHandler';

import {diff, patch} from './diffpatch';

const timeToUpdate = 1000; // In milliseconds

let boxes = [];

scriptHandler('mathbox/jsx', (text, script) => {
  const {view, result, root} = handleMathBoxJsx(unindent(text), script.parentNode),
        {commands, controls, onMathBoxViewBuilt} = result;

  window.mathboxes = boxes;

  build(view, root);

  (onMathBoxViewBuilt || attachControls)(view, controls, commands);
});

function handleMathBoxJsx(code, parentNode) { //get rid of parentNode
  const {result, root} = runMathBoxJsx(compile(code).code),
        {attachTo, cameraControls, editorPanel, plugins} = result,
        element = attachTo || parentNode;

  const view = mathBox({
    element,
    plugins: plugins || ['core', 'cursor'],
    controls: {
      klass: cameraControls || THREE.OrbitControls
    },
  });

  if (editorPanel) attachPanel(element, root);

  console.log(root);

  return {view, result, root};

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
    const panel = document.createElement('textarea');

    panel.className = 'editor-panel hidden';

    panel.value = code;

    panel.addEventListener('keyup', debounce(update, timeToUpdate));

    element.appendChild(panel);

    function update(event) {
      const newCode = panel.value;

      if (newCode !== code) updateScene(newCode); // possibly not the most efficient comparison? (might be!)

      function updateScene(newCode) {
        console.log('updating scene');
        try {
          const {result, root} = runMathBoxJsx(compile(newCode).code);

          view.remove('*');
          build(view, root);
          code = newCode; // should be somehwere else

         // patch(view, diff(currentRoot, root));
        }
        catch (e) {
          console.log('Failed to update', e);
        }
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