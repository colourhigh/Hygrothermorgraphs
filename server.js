var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');

var fs = require('fs');

app.use(bodyParser());

var port = process.env.PORT || 8088;

var router = express.Router();

var entrySchema  = new mongoose.Schema({
    date: String,
    values: [String]
});

var Entry = mongoose.model('Entry', entrySchema);

mongoose.connect('mongodb://localhost/hygrothermographs');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    router.get('/', function(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        fs.readFile('index.html',function (err, data){
                res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
                res.write(data);
                res.end();
            });
    });
    router.get('/coordinator.js', function(req, res) {
        fs.readFile('coordinator.js',function (err, data){
                res.writeHead(200, {'Content-Type': 'text/javascript','Content-Length':data.length});
                res.write(data);
                res.end();
            });
    });
    router.get('/main.css', function(req, res) {
        fs.readFile('main.css',function (err, data){
                res.writeHead(200, {'Content-Type': 'text/css','Content-Length':data.length});
                res.write(data);
                res.end();
            });
    });
    router.post('/schedule', function(req, res) {
        var results = JSON.parse(req.body.data);
        Entry.remove();
        results.forEach(function(p) {
            var entry = new Entry(p);
            entry.save();
        });
    });
    router.get('/schedule', function(req, res) {
        Entry.find(function (err, entries) {
          if (err) return console.error(err);
          res.json(entries);
          res.end();
        });
    });
});

app.use('/', router);
app.listen(port);
