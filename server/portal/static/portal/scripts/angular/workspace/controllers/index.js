import ApplicationFormCtrl from './application-form';
import ApplicationTrayCtrl from './application-tray';
import DataBrowserCtrl from './data-browser';
import {JobsStatusCtrl} from './jobs-status';
import {JobDetailsModalCtrl} from './jobs-status';
import WorkspacePanelCtrl from './workspace-panel';


let mod = angular.module('portal.workspace.controllers', []);

mod.controller('ApplicationFormCtrl', ApplicationFormCtrl);
mod.controller('ApplicationTrayCtrl', ApplicationTrayCtrl);
mod.controller('DataBrowserCtrl', DataBrowserCtrl);
mod.controller('JobDetailsModalCtrl', JobDetailsModalCtrl);
mod.controller('WorkspacePanelCtrl', WorkspacePanelCtrl);
mod.controller('JobsStatusCtrl', JobsStatusCtrl);
