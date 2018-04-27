export default class WorkbenchCtrl {

  constructor(systems) {
    this.systems = systems;
    console.log(this.systems);
    this.mydata_system = _.find(this.systems, {name:'My Data'});
  }
}
