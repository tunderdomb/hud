if( !hud.positions || !hud.dimensions ) throw new Error("Missing component 'hud.dimensions'")
hud.Role.extend({
  dimensions: function (){
    return hud.dimensions(this.element)
  },
  positions: function (){
    return hud.positions(this.element)
  }
})