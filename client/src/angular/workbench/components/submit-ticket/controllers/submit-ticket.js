import template from './../templates/submit-ticket.html';
import qs from 'query-string';

class SubmitTicketController {
  constructor() {
  }

  $onInit() {
    this.query_string = qs.stringify({ subject: this.subject, info: this.info });
    if (this.query_string.length > 0) {
        this.query_string = "?" + this.query_string;
    }
  }
}

// Bindings:
// subject - ticket subject
// info - hidden information from front end client to be appended to ticket problem description
 
const submitTicket = {
    template: template,
    bindings: {
        subject: '@',
        info: '@'
    },
    controller: SubmitTicketController,
};

export default submitTicket;
  