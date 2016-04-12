export function defineUI(components) {
  return {buildUI};

  function buildUI(template, el = document.createElement('div')) {
    const data = {};

    el.innerHTML = template;

    setup(el, data);

    return el;

    function setup(el, data) {
      console.log('setup', {el});
      const component = components[el.tagName];

      // do something with the result! (make one!)
      if (component) component(el, data); // might want to pass other stuff here

      for (let i = 0; i < el.children.length; i++) {
        setup(el.children[i], data);
      }
    }
  }
}