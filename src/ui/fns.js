const handlers = {
  '+': [/^\+(.*)$/, (match, data, element) => data.registerInput(match[1], element)],
  '-': [/^\-(.*)$/, (match, data, element) => data.registerOutput(match[1], element)]
};

export function establishInputsAndOutputs(element, data, streams = {}) {
  for (let name in handlers) {
    const [expression, fn] = handlers[name];

    const re = new RegExp(expression);

    for (let i = 0; i < element.attributes.length; i++) {
      const {name} = element.attributes[i],
            match = name.match(re);

      if (match) fn(match, data.scope(element), element);
    }
  }

  forEach(streams['+'], inStream => {
    console.log({inStream});
  });

  forEach(streams['-'], outStream => {
    console.log({outStream});
  });
}

function forEach(obj, fn) {
  for (let key in obj) fn(obj[key]);
}