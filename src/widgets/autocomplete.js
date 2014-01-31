hud.defineWidget({
  constructor: function AutoComplete(  ){
    this.input = this.findRole("input")
  }
}).defineRole({
  constructor: function Input(  ){
  },
  ontype: function( e ){
    console.log(this, e)
  }
})