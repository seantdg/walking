var express = require('express');
var app = express();
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json'));
var request = require('sync-request');
var stravaUtils = require('./utils/strava-auth')
var dbUtils = require('./utils/db')

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');


// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'))

if (config.points.length >= 10) {
    throw "10 or more waypoints?! The Google Maps API starts to get a bit pricey..!";
}

// index page 
app.get('/', function(req, res) {

	var activities = dbUtils.getActivities(function(activities){
		var distanceSoFar = 0;
		if(activities) {
			activities.forEach((activity) => distanceSoFar += (activity.distance/1000));
		}

		// overwrite for testing below
		//var distanceSoFar = 2000000;
		config.points.forEach((point) => {
			point.status = (distanceSoFar >= point.estimate ? 'Complete' : point.estimate - distanceSoFar + 'km to go');
		});

		var currentStart = "";
		var currentEnd = "";
		var currentDistance = 0;
		//work out which is the current journey
		for (var i = 0; i < config.points.length; i++) {
			if(config.points[i].status !== 'Complete') {
				currentStart = config.points[i-1].place;
				currentEnd = config.points[i].place;
				currentDistance = Math.abs(distanceSoFar - config.points[i-1].estimate);
				break;
			}
		}

	    res.render('pages/index', {
		apikey: config.googleAPIKey,
		points: config.points,
			start: currentStart,
			end: currentEnd,
			distance: currentDistance,
			activities: activities
	    });
	
	});
});

// connect - require basic auth
app.get('/connect', function(req, res) {
    if (req.header("authorization") !== "Basic " + config.contributingBasicAuth) {
        res.set({
            'WWW-Authenticate': 'Basic realm="Contribute your steps"'
        }).status(401).json({});
    } else {
        res.render('pages/connect', {
            clientId: config.stravaClientId,
            redirectUri: config.stravaRedirectUri,
            startDate: config.startDate
        });
    }
});

//strava callback - require basic auth
app.get('/callback', function(req, res) {
    if (req.header("authorization") !== "Basic " + config.contributingBasicAuth) {
        res.set({
            'WWW-Authenticate': 'Basic realm="Contribute your steps"'
        }).status(401).json({});
    } else {
        var scope = req.query.scope;
        var code = req.query.code;
        if (!code || scope.indexOf('activity:read') === -1) {
            res.render('pages/error', {
                error: 'Consent not provided'
            });
        } else {
            var activitiesAdded = stravaUtils.scrapeActivities(config, code);
			dbUtils.addActivities(activitiesAdded);
            res.render('pages/confirm', {
                total: activitiesAdded.length
            });
        }
    }
});


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error to db'));
db.once('open', function() {
	app.listen(3000);
	console.log('DB Up. App listening on 3000');
});
