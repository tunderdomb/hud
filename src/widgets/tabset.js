hud.defineWidget({
  constructor: function Tabset(  ){
    this.tabs = this.findRoles("tab", this)
    this.tablist = this.findRole("tablist")
    this.tabpool = this.findRole("tabpool")
    this.panels = this.findRole("tabpanel")
  },
  closeAll: function(  ){

  },
  onclick: function(  ){
    console.log(this, arguments)
  }
}).defineRole("tabpanel", {

}).defineRole({
  constructor: function Tab( el, tabset ){
    this.tabset = tabset
  },
  close: function(  ){

  },
  onclick: function(  ){
    console.log(this, arguments)
  }

})