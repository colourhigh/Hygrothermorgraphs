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

var tempMapSchema = new mongoose.Schema({
    code: String,
    created: {
        type: Date,
        default: Date.now
    }
});

var alphabetSchema = new mongoose.Schema({
    code: String,
    created: {
        type: Date,
        default: Date.now
    }
});
var scrapingSchema = new mongoose.Schema({
    name: String,
    trigrams: [String],
    date: Number
});

var Entry = mongoose.model('Entry', entrySchema);
var IP = mongoose.model('IP', ipSchema);
var TempMap = mongoose.model('TempMap', tempMapSchema);
var Alphabet = mongoose.model('Alphabet', tempMapSchema);
var Scrapings = mongoose.model('Scrapings', scrapingSchema);

mongoose.connect('mongodb://localhost/hygrothermographs');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {

    var statics = [{
        url: '/',
        path: 'Ether_Relay2/index.html',
        type: 'text/html'
    }, {
        url: '/schedule',
        path: 'schedule.html',
        type: 'text/html'
    }, {
        url: '/tempmap',
        path: 'tempmap.html',
        type: 'text/html'
    }, {
        url: '/alphabet',
        path: 'alphabet.html',
        type: 'text/html'
    }, {
        url: '/scrapings',
        path: 'scrapings.html',
        type: 'text/html'
    },{
        url: '/main.js',
        path: 'Ether_Relay2/main.js',
        type: 'text/javascript'
    }, {
        url: '/coordinator.js',
        path: 'coordinator.js',
        type: 'text/javascript'
    }, {
        url: '/alphabet.js',
        path: 'alphabet.js',
        type: 'text/javascript'
    }, {
        url: '/tempmap.js',
        path: 'tempmap.js',
        type: 'text/javascript'
    }, {
        url: '/scrapings.js',
        path: 'scrapings.js',
        type: 'text/javascript'
    }, {
        url: '/main.css',
        path: 'main.css',
        type: 'text/css'
    }];

    statics.forEach(function(s) {
        router.get(s.url, function(req, res) {
            fs.readFile(s.path, function(err, data) {
                res.writeHead(200, {
                    'Content-Type': s.type,
                    'Content-Length': data.length
                });
                res.write(data);
                res.end();
            });
        })
    });


    router.get('/js/alphabet.js', function(req, res) {
        Alphabet.find()
            .sort({
                'created': 'desc'
            })
            .limit(1)
            .exec(function(err, alpha) {
                var data = (alpha[0] || {
                    code: ''
                }).code;
                res.writeHead(200, {
                    'Content-Type': 'text/javascript',
                    'Content-Length': data.length
                });
                res.write(data);
                res.end();
            })
    });

    router.get('/js/tempmap.js', function(req, res) {
        TempMap.find()
            .sort({
                'created': 'desc'
            })
            .limit(1)
            .exec(function(err, alpha) {
                var data = (alpha[0] || {
                    code: ''
                }).code;
                res.writeHead(200, {
                    'Content-Type': 'text/javascript',
                    'Content-Length': data.length
                });
                res.write(data);
                res.end();
            })
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
        res.end();
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

    router.post('/json/alphabet', function(req, res) {
        var results = JSON.parse(req.body.data);
        var a = new Alphabet({
            code: results.code
        });
        a.save();
        res.end();
    });

    router.get('/json/alphabet', function(req, res) {
        Alphabet.find()
            .sort({
                'created': 'desc'
            })
            .limit(1)
            .exec(function(err, alpha) {
                res.json((alpha[0] || {
                    code: ''
                }));
                res.end();
            })
    });

    router.post('/json/tempmap', function(req, res) {
        var results = JSON.parse(req.body.data);
        var a = new TempMap({
            code: results.code
        });
        a.save();
        res.end();
    });

    router.get('/json/tempmap', function(req, res) {
        TempMap.find()
            .sort({
                'created': 'desc'
            })
            .limit(1)
            .exec(function(err, alpha) {
                res.json((alpha[0] || {
                    code: ''
                }));
                res.end();
            })
    });

    router.get('/json/scrapings', function(req, res) {
        Scrapings.find()
            .sort({
                'date': 'desc'
            })
            .exec(function(err, e) {
                res.json(e);
                res.end();
            })
    });

});

app.use('/', router);
app.listen(port);