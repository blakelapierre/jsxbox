export function defineUI(components) {
  return {buildUI, buildUIFromTemplate};

  function buildUIFromTemplate(template, element = document.createElement('div')) {
    const data = {};

    element.innerHTML = template;

    setupUI(element, data);

    return {element, data};
  }

  function buildUI(el, data = new Data()) { data.hookup(setupUI(el, data)); }

  function setupUI(el, data = new Data()) {
    console.log('setup', {el});
    const component = components[el.tagName];

    // do something with the result! (make one!)
    if (component) component(el, data); // might want to pass other stuff here

    for (let i = 0; i < el.children.length; i++) {
      setupUI(el.children[i], data);
    }
  }

}

class Data {
  constructor() {
    console.log('new Data!');

    this.inputs = new Inputs();
    this.outputs = new Outputs();
  }

  registerInput(name, element) {
    this.inputs.register(name, element);

  }

  registerOutput(name, element) {
    this.outputs.register(name, element);
  }

  scope() {
    return this;
  }

  hookup() {
    console.log({this});
    for (let i = 0; i < this.inputs.length; i++) {
      console.log(i, this.inputs.data[i]);
    }
  }
}

class Inputs {
  constructor() {
    this._data = [];
  }

  register(name, element) {
    this._data.push({name, element});
  }

  get length() { return this._data.length; }
  get data() { return this._data; }
}

class Outputs {
  constructor() {
    this.data = {};
  }

  register(name, element) {
    let names = name.split(':');


    const map = this.data[name] = (this.data[name] || {map: {}, list: []});

    map.map[element.tagName] = element;
    map.list.push(element);

    console.log('- out', name, element);
  }
}