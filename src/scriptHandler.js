export default function(type, fn) {
  window.addEventListener('load', load);

  console.log(`Registered ${type}`);

  function load() {
    const scripts = document.getElementsByTagName('script');

    Array.prototype.forEach.call(scripts,
      script => script.type === type ? fn(script.innerHTML, script)
                                     : undefined);
  }
}