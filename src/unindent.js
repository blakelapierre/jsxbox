export default function unindent(text) {
  let inferredIndentation = 0;
  for (let i = text.startsWith('\n') ? 1 : 0; i < text.length; i++) {
    const char = text.charAt(i);

    if (char === ' ') inferredIndentation++;
    else break;
  }

  console.log('indentation', inferredIndentation);

  if (inferredIndentation > 0) {
    const regex = new RegExp(`^ {${inferredIndentation}}`, 'gm');

    return text.substr(text.startsWith('\n')).replace(regex, '');
  }

  return text;
}