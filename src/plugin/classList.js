hud.Role.extend({
  addClass: function( cls ){
    this.element.classList.add(cls)
  },
  removeClass: function( cls ){
    this.element.classList.remove(cls)
  },
  hasClass: function( cls ){
    this.element.classList.contains(cls)
  },
  toggleClass: function( cls ){
    this.element.classList.toggle(cls)
  }
})