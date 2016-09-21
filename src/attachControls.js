let boxes = [];

export default function attachControls(view, controls, commands) {
  if (controls === undefined || commands === undefined) return;

  addListeners(generateActionHandler(controls, define(commands)));

  function define(commands) {
    return dispatch(commands, value => typeof value, {'function': identity}, createMultiplePropsHandler);

    function createMultiplePropsHandler(command) {
      return (repeat, view) => {
        forEach(command, executeCommand);

        function executeCommand(selector, props) {
          const {get, set} = proxied(view.select(selector));

          forEach(props, updateProp);

          function updateProp(propName, action) {
            console.log('updateProp', propName, typeof action, action);
            let isComplex = typeof action !== 'function',
                getNewValue = isComplex ? getComplexPropValue : action;

            set(propName, getNewValue(get(propName)));

            function getComplexPropValue(propValue) {
              switch (typeof action) {
                case 'function': return action(propValue);
                case 'number': return action;
                default:
                  const {length} = action,
                        fnIndex = length - 1,
                        fn = action[fnIndex],
                        dependencies = action.slice(0, fnIndex).map(get),
                        parameters = [propValue, ...dependencies];

                  return fn.apply(undefined, parameters);
              }
            }
          }
        }
      };
    }
  }

  function generateActionHandler(controls, commands) {
    const defaultHandler = {'+': noActionHandler, '-': noActionHandler};

    return generateHandler(buildActions(controls, commands));

    function generateHandler(actions) {
      return (keyCode, direction) => ((actions[keyCode] || defaultHandler)[direction] || noActionHandler)(view, keyCode);
    }

    function buildActions(controls, commands) {
      return controls.reduce(addAction, {});

      function addAction(actions, [keys, downCommandName, upCommandName]) {
        (typeof keys !== 'object' ? [keys] : keys).forEach(setAction);

        return actions;

        function setAction(key) {
          let pressed = false;
          actions[typeof key === 'number' ? key : key.charCodeAt(0)] = {
            '+': (...args) => {const repeat = pressed; pressed = true; commands[downCommandName](repeat, ...args); },
            '-': (...args) => {pressed = false; return (commands[upCommandName] || noUpHandler)(...args); }
          };
        }
      }
    }

    function noActionHandler(view, keyCode) { console.log(`No action for ${keyCode} on ${view}`); }

    function noUpHandler(view, keyCode) { console.log(`No up handler for ${keyCode}`); }
  }

  function addListeners(actionHandler) {
    const box = view._context.canvas.parentElement.parentElement;
    focusOn(box, 'mousedown');

    let exists = false;
    if (boxes.length === 0) {
      window.addEventListener('keydown', windowKeydownListener);
      window.addEventListener('keyup', windowKeyupListener);
    }
    else {
      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].box === box) {
          boxes[i].actionHandler = actionHandler;
          exists = true;
          break;
        }
      }
    }

    if (!exists) boxes.push({box, actionHandler, view});
  }
}

function windowKeydownListener(event) {
  const {length} = boxes,
        {target} = event;

  for (let i = 0; i < length; i++) {
    const {box, actionHandler} = boxes[i]; // don't need to pull actionHandler out here for most cases

    if (target === box) {
      actionHandler(event.keyCode, '+');
      // actionHandler(event.keyCode);
      return;
    }
  }

  console.log('no handler', event, boxes);
}

function windowKeyupListener(event) {
  const {length} = boxes,
        {target} = event;

  for (let i = 0; i < length; i++) {
    const {box, actionHandler} = boxes[i]; // don't need to pull actionHandler out here for most cases

    if (target === box) {
      actionHandler(event.keyCode, '-');
      return;
    }
  }

  console.log('no handler', event, boxes);
}

function dispatch(obj, tagger, handlers, defaultHandler) {
  return mapValues(obj, (name, value) => (handlers[tagger(value, name)] || defaultHandler)(value));
}

function identity(value) { return value; }

function proxied(obj) {
  return {
    get: (...args) => obj.get.apply(obj, args),
    set: (...args) => obj.set.apply(obj, args)
  };
}

function mapValues(obj, t) {
  const ret = {};
  for (let key in obj) ret[key] = t(key, obj[key]);
  return ret;
}

function updateValues(obj, t) {
  for (let key in obj) obj[key] = t(key, obj[key]);
  return obj;
}

function forEach(obj, fn) {
  for (let key in obj) fn(key, obj[key]);
  return obj;
}

function focusOn(el, eventName) { return el.addEventListener(eventName, () => el.focus()); }