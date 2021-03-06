var Radio = require("./Radio")

var methods = [
  'get', 'post', 'put', 'head', 'delete', 'options', 'trace', 'copy', 'lock', 'mkcol',
  'move', 'propfind', 'proppatch', 'unlock', 'report', 'mkactivity', 'checkout',
  'merge', 'm-search', 'notify', 'subscribe', 'unsubscribe', 'patch'
]

var mime = {}
mime["html"] = mime["text"] = "text/html"
mime["json"] = "application/json"
mime["xml"] = "application/xml"
mime["urlencoded"] = mime["form"] = mime["url"] = "application/x-www-form-urlencoded"
mime["form-data"] = mime["multipart"] = "multipart/form-data"

// upgrading your browser a bit
if ( !"".trim ) {
  String.prototype.trim = function (){
    return this.replace(/(^\s*|\s*$)/g, '')
  }
}
if ( ![].forEach ) {
  Array.prototype.forEach = function ( cb, context ){
    var i = -1
      , l = this.length
    while ( ++i < l ) {
      cb.call(context, this[i], i, this)
    }
  }
}

// utils

function createError( type, message ){
  var err = new Error(message)
  err.type = type
  return err
}

function createHTTP( cors ){
  var root = window || this
  var http = null
  if ( root.XMLHttpRequest && (root.location.protocol != "file:" || !root.ActiveXObject) ) {
    http = new XMLHttpRequest
    if ( cors && !("withCredentials" in http) ) {
      http = null
    }
  } else {
    if ( cors ) {
      if ( typeof root.XDomainRequest != "undefined" ) {
        http = new root.XDomainRequest()
      }
    }
    else {
      try { return new ActiveXObject("Microsoft.XMLHTTP") }
      catch ( e ) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP.6.0") }
      catch ( e ) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP.3.0") }
      catch ( e ) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP") }
      catch ( e ) {}
    }
  }
  return http
}

function noop(){}

function extend( obj, ext ){
  for ( var key in ext ) {
    if ( ext.hasOwnProperty(key) ) obj[key] = ext[key]
  }
  return obj
}

function parseData( data ){
  var ret = {}
  data.split("&").forEach(function ( pair ){
    var parts = pair.split("=")
    ret[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1])
  })
  return ret
}

function serializeData( data ){
  var pairs = []
  for ( var key in data ) {
    pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
  }
  return pairs.join("&")
}

/**
 * A class to orchestrate a request
 *
 * @param method{String}
 * @param url{String}
 * */
function RequestOptions( method, url ){
  this.headers = {}
  this.query = {}
  this.data = null
  this.form = null
  this.method = method
  this.url = url
}

RequestOptions.prototype = {}
RequestOptions.prototype.guessHeader = function (){
  var contentType = this.getHeader("Content-Type")
  if ( contentType ) return
  var data = this.form || this.data
  var dataType = {}.toString.call(data)
  switch ( true ) {
    case this.method == "GET":
    case this.method == "HEAD":
      break
    case typeof data == "string":
    case typeof data == "number":
    case typeof data == "boolean":
      this.setHeader("Content-Type", "text/html")
      break
    case dataType == "[object File]":
    case dataType == "[object Blob]":
    case dataType == "[object FormData]":
      break
    case dataType == "[object Object]":
    case Array.isArray(data):
    default:
      this.setHeader("Content-Type", "application/json")
  }
}
RequestOptions.prototype.createBody = function (){
  var data = this.form || this.data
  var dataType = {}.toString.call(data)
  var contentType = this.getHeader("Content-Type")
  switch ( true ) {
    case this.method == "GET":
    case this.method == "HEAD":
    case typeof data == "string":
    case dataType == "[object File]":
    case dataType == "[object Blob]":
    case dataType == "[object FormData]":
    case !contentType:
      return data
    case contentType == "application/x-www-form-urlencoded":
      return serializeData(data)
    case contentType == "application/json":
      return JSON.stringify(data)
    default:
      return data
  }
}
RequestOptions.prototype.prepare = function (){
  var http = createHTTP(this.cors)
  var query = serializeData(this.query)
  var method = this.method
  var url = this.url
  var headers = this.headers

  // query string
  if ( query ) {
    url += ~url.indexOf("?")
      ? "&" + query
      : "?" + query
  }

  // CORS
  if ( this.withCredentials ) http.withCredentials = true

  // open connection
  if ( this.user && this.password ) {
    http.open(method, url, true, this.user, this.password)
  }
  else {
    http.open(method, this.url, true)
  }

  // set request headers
  for ( var field in headers ) {
    if ( headers[field] ) {
      http.setRequestHeader(field, headers[field])
    }
  }

  return http
}
RequestOptions.prototype.attach = function ( field, file, filename ){
  if ( window.FormData ) {
    this.form = this.form || new FormData()
    if ( this.form.append ) {
      this.form.append(field, file, filename)
    }
    else {
      throw new Error("Couldn't append to " + this.form)
    }
  }
  else {
    this.addData(field, file)
  }
}
RequestOptions.prototype.setData = function ( name, value ){
  if ( value != undefined ) {
    this.data = this.data || {}
    this.data[name] = value
  }
  else {
    this.data = name
  }
  this.guessHeader()
}
RequestOptions.prototype.setForm = function ( form ){
  if ( form instanceof Element && form.tagName == "FORM" ) {
    if ( window.FormData ) {
      this.form = new FormData(form)
    }
    else {
      [].slice.call(form).forEach(function ( field ){
        if ( field.name ) this.addData(field.name, field.value)
      }, this)
    }
  }
  else {
    this.form = form
  }
  this.guessHeader()
}
RequestOptions.prototype.addData = function ( name, value ){
  this.data = this.data || {}
  if ( value != undefined ) {
    this.data[name] = value
  }
  else if ( typeof name != "string" ) extend(this.data, name)
  this.guessHeader()
}
/**
 * Get the lowercase key value of a header.
 * */
RequestOptions.prototype.getHeader = function ( name ){
  return this.headers[name.toLowerCase()]
}
/**
 * Set a single header or a hash of header key-value pairs.
 * The key is lowercased.
 * */
RequestOptions.prototype.setHeader = function ( key, value ){
  if ( value != undefined ) {
    this.headers[key.toLowerCase()] = value
  }
  else if ( typeof key != "string" ) {
    for ( var field in key ) {
      this.headers[field.toLowerCase()] = key[field]
    }
  }
}

RequestOptions.prototype.addQuery = function ( key, value ){
  if ( value != undefined ) {
    this.query[key] = value
  }
  else if ( typeof key != "string" ) {
    for ( var field in key ) {
      this.query[field] = key[field]
    }
  }
}
RequestOptions.prototype.setUser = function ( user, password ){
  this.user = user
  this.password = password
}

/**
 * An objecet representing a request
 *
 * @param method{String}
 * @param url{String}
 * */
function Request( method, url ){
  this.channels = {}
  this.options = new RequestOptions(method, url)
}

Request.prototype = {}
extend(Request.prototype, Radio.prototype)

/**
 * Set `Authorization` header field.
 *
 * @param user {String}
 * @param pass {String}
 * @return {Request}
 * */
Request.prototype.auth = function ( user, pass ){
  this.header("Authorization", "Basic" + btoa(user + ":" + pass))
  return this
}

/**
 * Set `user` and `password` arguments for http request `open` method.
 *
 * @param user {String}
 * @param pass {String}
 * @return {Request}
 * */
Request.prototype.user = function ( user, pass ){
  this.options.setUser(user, pass)
  return this
}

/**
 * Set header field(s)
 *
 * @param field {Object|String}
 * @param [value] {String}
 * @return {Request}
 * */
Request.prototype.header = function ( field, value ){
  this.options.setHeader(field, value)
  return this
}

/**
 * @param name {Object|String} a hash of query key/value pairs or a query key
 * @param [value] {String} query must be String if given
 * */
Request.prototype.query = function ( name, value ){
  this.options.addQuery(name, value)
  return this
}

/**
 * Set `Content-Type` header
 *
 * @param contentType {String}
 * @return {Request}
 * */
Request.prototype.contentType = function ( contentType ){
  contentType = mime[contentType] || contentType
  this.header("Content-Type", contentType)
  return this
}

/**
 * Set `Accept` header
 *
 * @param accept {String}
 * @return {Request}
 * */
Request.prototype.accept = function ( accept ){
  accept = mime[accept] || accept
  this.header("Accept", accept)
  return this
}

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 */
Request.prototype.withCredentials = function (){
  this.options.withCredentials = true
  return this
}

/**
 * Set the data to be sent to a form as FormData (if available)
 *
 * @param form {Element|FormData} the form to be sent
 * @return {Request}
 * */
Request.prototype.form = function ( form ){
  this.options.setForm(form)
  return this
}

/**
 * Appends data to the internal form data.
 * Using the `FormData` API.
 *
 * @param field{String}
 * @param file{Blob|File}
 * @param [filename]{String}
 * @return {Request}
 */
Request.prototype.attach = function ( field, file, filename ){
  this.options.attach(field, file, filename)
  return this
}

/**
 * Adding fields to the internal data hash.
 * Calling this without explicitly setting the Content-Type header
 * will automatically set it to `application/json`.
 * @param name{Object|String}
 * @param [value]{String}
 * @return {Request}
 * */
Request.prototype.send = function ( name, value ){
  this.options.setData(name, value)
  return this
}

/**
 * Append fields to the data to be sent.
 * @param name{Object|String}
 * @param [value]{String}
 * @return {Request}
 * */
Request.prototype.append = function ( name, value ){
  this.options.addData(name, value)
  return this
}

/**
 * Abort the request.
 * Also fires the `abort` event.
 * @return {Request}
 * */
Request.prototype.abort = function (){
  if ( this.aborted ) return this
  this.aborted = true
  this.http.abort()
  this.broadcast("abort")
  return this
}

/**
 * Set a timeout for the request.
 * If the timer expires before the request finishes
 * it aborts the request and posses a `timeout` error to the callback.
 *
 * @param ms{Number}
 * @return {Request}
 * */
Request.prototype.timeout = function ( ms ){
  this.timeoutTime = ms
  return this
}

/**
 * Enable Cross Origin requests.
 * If an explicit attempt is made for a cross origin request,
 * but such a thing is not supported by your browser,
 * the request fails before opening a connection.
 * In this case an error with a type of `cors` will be passed to the end callback.
 *
 * @return {Request}
 * */
Request.prototype.cors = function (){
  this.options.cors = true
  return this
}

/**
 * Kicks off the communication.
 *
 * @param [callback]{Function}
 * @return {Request}
 * */
Request.prototype.end = function ( callback ){
  callback = callback || noop
  var req = this
  var options = this.options
  var http = options.prepare()
  var timeoutId
  var timeout = this.timeoutTime
  this.http = http

  if ( this.options.cors && !http ) {
    callback(createError("cors", "Cross Origin requests are not supported"))
    return this
  }

  http.onreadystatechange = function (){
    if ( http.readyState != 4 ) return
    if ( http.status == 0 ) {
      if ( req.aborted ) {
        callback(createError("timeout", "Connection timed out"))
      }
      else {
        callback(createError("crossDomain", "Origin is not allowed by Access-Control-Allow-Origin"))
      }
    }
    else req.broadcast("end")
  }
  if ( http.upload ) {
    http.upload.onprogress = function ( e ){
      e.percent = e.loaded / e.total * 100
      req.broadcast("progress", e)
    }
  }

  req.listenOnce("abort", function (){
    clearTimeout(timeoutId)
  })
  req.listenOnce("end", function (){
    clearTimeout(timeoutId)
    callback(null, new Response(this))
  })

  if ( timeout ) {
    timeoutId = setTimeout(function (){
      req.abort()
    }, options.timeout)
  }

  this.broadcast("send")
  http.send(options.createBody())
  return this
}

// Response initializers

function setStatus( res, req ){
  var http = req.http
  var status = http.status
  var type = status / 100 | 0

  res.status = http.status
  res.statusType = type

  res.info = type == 1
  res.ok = type == 2
  res.clientError = type == 4
  res.serverError = type == 5
  res.error = (type == 4 || type == 5)
    ? new Error("Cannot " + req.options.method + " " + req.options.url + " " + status)
    : false

  res.created = status == 201
  res.accepted = status == 202
  res.noContent = status == 204 || status == 1223
  res.badRequest = status == 400
  res.unauthorized = status == 401
  res.notAcceptable = status == 406
  res.notFound = status == 404
  res.forbidden = status == 403
  res.internalServerError = status == 500
}

function parseHeaders( req ){
  var headers = req.http.getAllResponseHeaders()
    , lines = headers.split(/\r?\n/)
    , fields = {}

  lines.pop() // trailing CRLF
  lines.forEach(function ( line ){
    var i = line.indexOf(":")
      , field = line.slice(0, i).toLowerCase()
    fields[field] = line.slice(i + 1).trim()
  })

  fields["content-type"] = req.http.getResponseHeader("content-type")
  return fields
}

function parseBody( contentType, responseText ){
  switch ( contentType ) {
    case "application/x-www-form-urlencoded":
      return parseData(responseText)
    case "application/json":
      return JSON.parse(responseText)
    default:
      return responseText
  }
}

function parseValue( val ){
  var low = val.toLowerCase()
    , int = parseInt(val)
    , float = parseFloat(val)
  switch ( true ) {
    case low == "true":
      return true
    case low == "false":
      return false
    case low == "null":
      return null
    case !isNaN(float):
      return float
    case !isNaN(int):
      return int
    default :
      return val
  }
}

function Response( req ){
  var resp = this
  var http = req.http
  this.text = http.responseText
  setStatus(this, req)
  this.headers = parseHeaders(req)
  var contentType = this.header("Content-Type")
  if ( contentType ) contentType.split(/\s*;\s*/).forEach(function ( str ){
    var p = str.split(/\s*=\s*/)
    if ( p[1] ) {
      resp[p[0]] = p[1]
    }
    else {
      resp.contentType = p[0]
    }
  })
  this.body = req.method != "HEAD" && http.responseText && this.contentType
    ? parseBody(this.contentType, http.responseText)
    : {}
}

Response.prototype = {
  body: null,
  header: function ( field ){
    return this.headers[field.toLowerCase()]
  },
  headerParams: function ( field ){
    var header = this.header(field)
    if ( !header ) return null
    var params = {}
    header.split(/\s*[;,]\s*/).forEach(function ( str ){
      var p = str.split(/\s*=\s*/)
        , key = p[0]
        , val = p[1]
      if ( val ) {
        params[key] = parseValue(val)
      }
      else {
        params[key] = true
      }
    })
    return params
  }
}

/**
 * main request function
 *
 * @param method{String}
 * @param url{String}
 * */
function request( method, url ){
  switch ( true ) {
    case !url:
      return new Request("GET", method)
    case typeof url == "function":
      return new Request("GET", method).end(url)
    default :
      return new Request(method, url)
  }
}

// define common request methods as static functions
methods.forEach(function ( method ){
  request[method.toLowerCase()] = function ( url, fn ){
    var req = request(method.toUpperCase(), url)
    fn && req.end(fn)
    return req
  }
})

module.exports = request
