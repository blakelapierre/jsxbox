window.addEventListener('load', load);

const handlers = {};

export default function tagHandler(tag, handlerConfig) {
  const tagHandlers = (handlers[tag] = handlers[tag] || {});

  for (let attribute in handlerConfig) {
    for (let value in handlerConfig[attribute]) {
      const attributeHandlers = (tagHandlers[attribute] = tagHandlers[attribute] || {});

      (attributeHandlers[value] = attributeHandlers[value] || []).push(handlerConfig[attribute][value]);
    }
  }
}

function load() {
  for (let tag in handlers)
    Array.prototype.forEach.call(document.getElementsByTagName(tag), createElementHandler(handlers[tag]));

  function createElementHandler(attributeHandlers) {
    return element => {
      for (let attribute in attributeHandlers)
        for (let value in attributeHandlers[attribute])
          if (element[attribute] === value)
            attributeHandlers[attribute][value].forEach(callHandler);

      function callHandler(handler) { handler(element); }
    };
  }
}