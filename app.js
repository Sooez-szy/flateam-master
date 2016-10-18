/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var ejs = require('ejs');

var config = require('./config');
var flash = require('connect-flash');
var errorhandler = require('errorhandler');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer({dest: './statics/photo'});
var favicon = require('serve-favicon');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
//var morgan = require('morgan');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');

app.engine('.html', ejs.__express);
// 修改模板，支持html
app.set('view engine', 'html');

app.use(flash());
app.use(favicon(__dirname + '/public/img/favicon.ico'));
//app.use(express.logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.bodyParser({ keepExtensions: true, uploadDir:  }));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(cookieParser());
app.use(session({
  secret: config.cookieSecret,
  key: config.db,
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  store: new MongoStore({
    url:config.conn,
    db: config.db
  })
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-promise')());
routes(app);
// development only
if ('development' == app.get('env')) {
  app.use(errorhandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

