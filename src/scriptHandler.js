export default function(type, fn) {
  window.addEventListener('load', load);

  console.log(`Registered ${type}`);

  function load() {
    const scripts = document.getElementsByTagName('script');

    console.log('handling', Array.prototype.map.call(scripts, ({src, type}) => `${type} ${src}`));

    Array.prototype.forEach.call(scripts,
      script => script.type === type ? fn(script.innerHTML, script)
                                     : undefined);
  }
}