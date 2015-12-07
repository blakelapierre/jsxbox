export default function patch(view, changes) {
  changes.forEach(applyToView);

  function applyToView(change) {
    const {type} = change;

    switch(type) {
      case 'remove': remove(view, change); break;
      case 'add': add(view, change); break;
      case 'move': move(view, change); break;
      case 'modify': modify(view, change); break;
    }

    function remove(view, change) {

    }

    function add(view, change) {

    }

    function move(view, change) {

    }

    function modify(view, change) {

    }

    function walkPath(view, path) {
      // should return the element selected by path
    }
  }
}