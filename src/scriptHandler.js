module.exports = function(type, fn) {
  window.addEventListener('load', function() {
    var scripts = document.getElementsByTagName('script');

    Array.prototype.forEach.call(scripts, function(script) {
      if (script.type === type) fn(script.innerHTML); // Is there another way to select these?
    });
  });
};