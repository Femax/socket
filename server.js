var express = require('express'),
    http = require('http'),
    app = express(),
    server = app.listen(3000),
    io = require('socket.io').listen(server),
    Datastore = require('nedb'),
    db = new Datastore(),
    os = require('os');

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(function (req, res, next) {
        res.setHeader('X-Frame-Options', 'GOFORIT');
        next();
    });
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

//setup the errors
//server.error(function(err, req, res, next){
//    if (err instanceof NotFound) {
//        res.render('404.jade', { locals: {
//            title : '404 - Not Found'
//            ,description: ''
//            ,author: ''
//            ,analyticssiteid: 'XXXXXXX'
//        },status: 404 });
//    } else {
//        res.render('500.jade', { locals: {
//            title : 'The Server Encountered an Error'
//            ,description: ''
//            ,author: ''
//            ,analyticssiteid: 'XXXXXXX'
//            ,error: err
//        },status: 500 });
//    }
//});

var videoSocket;
io.set('transports',['xhr-polling']);

io.of('/video')
    .on('connection', function (socket) {
        videoSocket = socket;

        var interfaces = os.networkInterfaces();
        var addresses = [];
        for (k in interfaces) {
            for (k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family == 'IPv4' && !address.internal) {
                    addresses.push(address.address)
                }
            }
        }

        videoSocket.emit('config', {addresses: addresses});
    });

io.of('/control')
    .on('connection', function (socket) {
        socket.on('control', function (data) {
            videoSocket.emit('changeState', {state: data.action});
        });

        socket.on('playVideo', function (data) {
            videoSocket.emit('playVideo', data);
        });
    });


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/html/client.html')
});

app.get('/control', function (req, res) {
    res.sendfile(__dirname + '/public/html/control.html')
});

app.get('/youtube', function (req, res) {
    res.sendfile(__dirname + '/public/html/clientYoutube.html')
});

app.post('/api/youtube/video', function (req, res) {
    db.insert(req.body, function (err, newDocs) {
        // Two documents were inserted in the database
        // newDocs is an array with these documents, augmented with their _id
    });
});

////A Route for Creating a 500 Error (Useful to keep around)
//app.get('/500', function(req, res){
//    throw new Error('This is a 500 Error');
//});
//
////The 404 Route (ALWAYS Keep this as the last route)
//app.get('/*', function(req, res){
//    throw new NotFound;
//});
//
//function NotFound(msg){
//    this.name = 'NotFound';
//    Error.call(this, msg);
//    Error.captureStackTrace(this, arguments.callee);
//}