import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import attachControls from './attachControls';
import debounce from './util/debounce';
import unindent from './util/unindent';

import {diff, patch} from './diffpatch/index';

import {diffString, diffString2, diffStringRaw} from './diffString';

import {diffChars} from 'diff';

const timeToUpdate = 1000; // In milliseconds

// pretty terrible globals
window.mathboxes = window.mathboxes || [];
let boxes = window.mathboxes;

export default function attachMathBox(code, parentNode) {
  const {view, result, root} = handleMathBoxJsx(unindent(code))(parentNode),
        {commands, controls, onMathBoxViewBuilt} = result;

  build(view, root);

  if (onMathBoxViewBuilt) onMathBoxViewBuilt(view, controls, commands);
  if (attachControls) attachControls(view, controls, commands);

  boxes.push({parentNode, commands, controls, result, view});
}

function handleMathBoxJsx(code) {
  const {result, root} = runMathBoxJsx(compile(code).code),
        {attachTo, cameraControls, editorPanel, plugins} = result;

  return parentNode => {
    const element = attachTo || parentNode; // kind of strange. oh well

    const container = document.createElement('mathbox-container');
    element.appendChild(container);

    const view = mathBox({
      // element,
      element: container,
      plugins: plugins || ['core', 'cursor'],
      controls: {
        klass: cameraControls || THREE.OrbitControls
      },
    }), thumbnailCanvas = document.createElement('canvas')
      , thumbnailContext = thumbnailCanvas.getContext('2d');

    thumbnailCanvas.width = view._context.canvas.width / 5;
    thumbnailCanvas.height = view._context.canvas.height / 5;

    element.addEventListener('resize', event => console.log('resize', event));

    if (editorPanel) attachPanel(element, root);


    return {view, result, root};

    function attachPanel(element, currentRoot) {
      const updateStrategies = {
        'replace': replaceStrategy,
        'diffpatch': diffpatchStrategy
      }, defaultUpdateStrategy = 'replace';

      const data = {currentUpdateStrategy: defaultUpdateStrategy};

      // let currentUpdateStrategy = defaultUpdateStrategy;

      let hasError = false,
          oldCode = '',
          codeHistory = [];

      buildUI();

      function buildUI() {
        const template = `
          <panel>
            <edit-panel>
              <select [emitTo]="currentUpdateStrategy">
               <option value="replace">replace</option>
               <option value="diffpatch">diffpatch</option>
              </select>
              <textarea></textarea>
              <error-area></error-area>
              <diff-area></diff-area>
            </edit-panel>
            <history></history>
          </panel>`;

        const built = build(template);

        element.appendChild(built.children[0]);

        function build(template, el = document.createElement('div')) {
          const components = {
            PANEL(panel) {
              panel.className = 'panel before';
            },

            'EDIT-PANEL'(editPanel) {

            },

            'ERROR-AREA'(errorArea) {

            },

            'DIFF-AREA'(diffArea) {

            },

            HISTORY(history) {
            },

            SELECT(select) {
              console.log({select});
              for (let i = 0; i < select.attributes.length; i++) {
                const attribute = select.attributes[i];

                {
                  const match = attribute.name.match(/^\[(change)\]$/);

                  console.log({match});
                  if (match) {
                    const event = match[1];
                    select.addEventListener(event, event => attribute.value);
                  }
                }

                {
                  const match = attribute.name.match(/^\[(emitto)\]$/);

                  console.log({match});
                  if (match) {
                    const event = match[1];

                    switch (event) {
                      case 'emitto':
                        select.addEventListener('change', event => {
                          data[attribute.value] = Array.prototype.map.call(event.target.selectedOptions, (({value}) => value)).join(',');
                        });
                        break;
                    }
                  }
                }
              }
            }
          };

          console.log({components});

          el.innerHTML = template;

          setup(el);

          return el;

          function setup(el, data) {
            console.log('setup', {el});
            const component = components[el.tagName];

            if (component) component(el); // might want to pass other stuff here

            for (let i = 0; i < el.children.length; i++) {
              setup(el.children[i], data);
            }
          }
        }

        const panel = document.createElement('panel'),
              editPanel = document.createElement('edit-panel'),
              history = document.createElement('history'),
              select = createSelect(Object.keys(updateStrategies), defaultUpdateStrategy),
              textarea = document.createElement('textarea'),
              diffarea = document.createElement('diff-area'),
              updateSignaler = createUpdateSignaler(),
              errorArea = document.createElement('error-area');

        const signalUpdate = debounce(update, timeToUpdate);

        panel.className = 'panel before';

        select.addEventListener('change',
          event => data.currentUpdateStrategy = Array.prototype.map.call(event.target.selectedOptions, (({value}) => value)).join(','));

        textarea.addEventListener('keyup', (...args) => willUpdateAt(signalUpdate(args)));
        textarea.value = code;

        [ select,
          textarea,
          errorArea,
          diffarea
        ].map(el => editPanel.appendChild(el));

        element.appendChild(panel);
        panel.appendChild(editPanel);
        panel.appendChild(history);

        function createUpdateSignaler() {
          const signaler = document.createElement('update-signaler'),
                left = document.createElement('div'),
                right = document.createElement('div');

          [left, right].map(el => signaler.appendChild(el));

          return signaler;
        }

        function willUpdateAt(time) {
          console.log('will update at', time);
        }

        function update(event) {
          const newCode = textarea.value;

          const currentHistoryRecord = addHistoryRecord(code);

          if (newCode !== oldCode) {
            const {diff, error} = updateScene(newCode); // possibly not the most efficient comparison? (might be!)
            if (error) {
              currentHistoryRecord.error = error;
              currentHistoryRecord.diff = diff;
              currentHistoryRecord.historyElement.className = 'had-error';
            }
          }

          function addHistoryRecord(code) {
            const currentHistoryRecord = {code, time: new Date()};
            const historyIndex = codeHistory.length;

            codeHistory.push(currentHistoryRecord);

            const historyElement = document.createElement('history-element'),
                  renderSurface = document.createElement('render-surface'),
                  image = document.createElement('img'),
                  info = document.createElement('info');

            thumbnailContext.drawImage(view._context.canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

            image.src = thumbnailCanvas.toDataURL();

            // renderSurface.innerHTML = newCode;

            if (historyIndex > 0) info.innerHTML = `+${Math.round((currentHistoryRecord.time - codeHistory[historyIndex - 1].time) / 1000)}s later`;

            historyElement.dataset.historyIndex = historyIndex;
            renderSurface.dataset.historyIndex = historyIndex;
            image.dataset.historyIndex = historyIndex;

            historyElement.addEventListener('click', historyClickHandler);

            renderSurface.appendChild(image);

            historyElement.appendChild(info);
            historyElement.appendChild(renderSurface);

            history.appendChild(historyElement);

            history.scrollTop = history.scrollHeight - history.clientHeight;

            currentHistoryRecord.historyElement = historyElement;

            return currentHistoryRecord;

            function historyClickHandler(event) {
              console.log(event);
              const code = codeHistory[event.target.dataset.historyIndex].code;

              const currentHistoryRecord = addHistoryRecord(code);

              if (newCode !== code) {
                textarea.value = code;
                const {diff, error} = updateScene(code); // possibly not the most efficient comparison? (might be!)

                if (error) {
                  currentHistoryRecord.error = error;
                  currentHistoryRecord.diff = diff;
                  currentHistoryRecord.historyElement.className = 'had-error';
                }
              }
            }
          }

          function updateScene(newCode) {
            console.log('updating scene');
            oldCode = newCode;

            const diff = updateDiffArea(code, newCode);

            let error;

            try {
              const {result, root} = runMathBoxJsx(compile(newCode).code);

              updateStrategies[data.currentUpdateStrategy](view, root, newCode, result);

              code = newCode; // woa

              hasError = false;
              errorArea.innerHTML = '';
              editPanel.className = '';
            }
            catch (e) {
              console.log('Failed to update', e);
              hasError = true;
              errorArea.innerHTML = e.toString();
              editPanel.className = 'panel has-error';

              error = e;
            }

            return {diff, error};
          }

          function updateDiffArea(code, newCode) {
            const diff = diffChars(code, newCode);

            diffarea.innerHTML = diff.reduce((s, e) => {
              if (e.added) return `${s}<ins>${escape(e.value)}</ins>`;
              else if (e.removed) return `${s}<del>${escape(e.value)}</del>`;
              return s;
            }, '');
          }

          function escape(s) {
            return s.replace(/>/g, '&gt;').replace(/</g, '&lt;');
          }
        }
      }

      function replaceStrategy(view, root, newCode, result) {
        view.remove('*');
        build(view, root);

        const {controls, commands} = result;
        if (attachControls) attachControls(view, controls, commands);
      }

      function diffpatchStrategy(view, root, newCode) {
        throw new Error('diffpatch not implemented yet!');

        // patch(view, diff(currentRoot, root));
      }
    }
  };

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
}

function compile(text) {
  return transform(text, {
    presets: [es2015],
    plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
  });
}

function build(view, {name, children, props}) {
  if (name !== 'root') view = handleChild(name, props, view);

  (children || []).forEach(child => build(view, child));

  return view;
}

function handleChild(name, props, view) {
  let props1 = {}, props2;

  for (let propName in props) handleProp(propName, props[propName]);

  // view = view[name](props1, props2);
  return view[name](props1, props2);

  function handleProp(propName, prop) {
    console.log({name, propName, prop, props1, props2, view});
    if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
    else (props1 = (props1 || {}))[propName] = prop;
  }
}

function createSelect(values, defaultValue = (values || [])[0], names = values) {
  const select = document.createElement('select');

  names.forEach(name => {
    const option = document.createElement('option');

    option.value = name;
    option.innerHTML = name;

    if (name === defaultValue) option.selected = true;

    select.appendChild(option);
  });

  return select;
}