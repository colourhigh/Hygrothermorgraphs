var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var fs = require('fs');

app.use(bodyParser());

var port = process.env.PORT || 8088;

var router = express.Router();

var entrySchema = new mongoose.Schema({
    date: String,
    values: [String],
    start: String,
    end: String
});

var ipSchema = new mongoose.Schema({
    ip: String
});

var Entry = mongoose.model('Entry', entrySchema);
var IP = mongoose.model('IP', ipSchema);

mongoose.connect('mongodb://localhost/hygrothermographs');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    router.get('/', function(req, res) {
        fs.readFile('Ether_Relay2/index.html', function(err, data) {
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Content-Length': data.length
            });
            res.write(data);
            res.end();
        });
    });
    router.get('/schedule', function(req, res) {
        fs.readFile('index.html', function(err, data) {
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Content-Length': data.length
            });
            res.write(data);
            res.end();
        });
    });
    router.get('/coordinator.js', function(req, res) {
        fs.readFile('coordinator.js', function(err, data) {
            res.writeHead(200, {
                'Content-Type': 'text/javascript',
                'Content-Length': data.length
            });
            res.write(data);
            res.end();
        });
    });
    router.get('/main.js', function(req, res) {
        fs.readFile('Ether_Relay2/main.js', function(err, data) {
            res.writeHead(200, {
                'Content-Type': 'javascript/css',
                'Content-Length': data.length
            });
            res.write(data);
            res.end();
        });
    });
    router.get('/main.css', function(req, res) {
        fs.readFile('main.css', function(err, data) {
            res.writeHead(200, {
                'Content-Type': 'text/css',
                'Content-Length': data.length
            });
            res.write(data);
            res.end();
        });
    });
    router.post('/json/schedule', function(req, res) {
        var results = JSON.parse(req.body.data);
        IP.find().remove();
        Entry.find().remove();
        var ip = new IP({
            ip: results.ip
        });
        ip.save();
        results.entries.forEach(function(p) {
            var entry = new Entry(p);
            entry.save();
        });
    });
    router.get('/json/schedule/ip', function(req, res) {
        IP.findOne(function(err, ip) {
            res.json(ip);
            res.end();
        });
    });
    router.get('/json/schedule/entries', function(req, res) {
        Entry.find(function(err, entries) {
            if (err) return console.error(err);
            res.json(entries);
            res.end();
        });
    });
});

app.use('/', router);
app.listen(port);