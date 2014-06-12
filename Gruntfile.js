module.exports = function ( grunt ){

  grunt.initConfig({release: {
    options: {
      bump: false, //default: true
      file: 'package.json', //default: package.json
      add: false, //default: true
      commit: true, //default: true
      tag: true, //default: true
      push: false, //default: true
      pushTags: false, //default: true
      npm: false, //default: true
      npmtag: false, //default: no tag
      folder: '/', //default project root
      tagName: '<%= version %>', //default: '<%= version %>'
      commitMessage: 'release <%= version %>', //default: 'release <%= version %>'
      tagMessage: 'version <%= version %>', //default: 'Version <%= version %>',
      github: {
        repo: 'tunderdomb/hud', //put your user/repo here
        usernameVar: 'GITHUB_USERNAME', //ENVIRONMENT VARIABLE that contains Github username
        passwordVar: 'GITHUB_PASSWORD' //ENVIRONMENT VARIABLE that contains Github password
      }
    }
  }
  })

  require('load-grunt-tasks')(grunt)
}