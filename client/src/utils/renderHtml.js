import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

// From https://github.com/remarkablemark/html-react-parser/issues/94#issuecomment-509679484

export default function renderHtml(html, opts = {}) {
  return parse(DOMPurify.sanitize(html));
}
