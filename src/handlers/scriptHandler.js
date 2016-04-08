import tagHandler from './tagHandler';

export default function scriptHandler(type, handler) {
  tagHandler('script', {'type': {[type]: element => handler(element.innerHTML, element)}});
}