import template from './../../templates/components/push-keys.modal.html'

class SystemPushKeysController {
  constructor(SystemsService){
    this.SystemsService = SystemsService;
    this.form = {};
    this.ui = {};
  }

  ok(){
    this.ui.loading = true;
    this.SystemsService.pushKeys(
      this.resolve.sys.id,
      this.form
    ).
    then((resp)=>{
      this.ui.error = false;
      this.ui.message = "Public Key added successfully";
      return 
    }, (err)=>{
      this.ui.error = true;
      this.ui.message = err.data.message;
    }).
    finally(()=>{
      this.ui.loading = false;
      if ( !this.ui.error ){
        this.close({
          $value: {
            sys: this.sys,
            form: this.form
          }
        })
      }
    });
  }

  cancel(){
    this.dismiss({$value:'cancel'});
  }

  $onInit(){
    this.form = {
      password: '',
      token: '',
      hostname: this.resolve.sys.storage.host,
      name: this.resolve.sys.name
    }
  }
}

SystemPushKeysController.$inject = [
  'SystemsService'
];

const systemPushKeysModal = {
  template: template,
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controller: SystemPushKeysController,
};

export default systemPushKeysModal
