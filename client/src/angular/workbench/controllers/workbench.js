import * as _ from 'underscore';

export default class WorkbenchCtrl {

  constructor(systems, UserService) {
    'ngInject';
    this.systems = systems;
    this.mydata_system = _.find(this.systems, {name:'My Data'});
    this.UserService = UserService;
  }
}
