var request = require('sync-request');
module.exports = {
	scrapeActivities: function(config, code) {
        //get access token
        var tokenResponse = request("POST", "https://www.strava.com/oauth/token?" +
            "client_id=" + config.stravaClientId +
            "&client_secret=" + config.stravaClientSecret +
            "&code=" + code +
            "&grant_type=authorization_code");
        var tokenPayload = JSON.parse(tokenResponse.getBody());
        var accessToken = tokenPayload.access_token;

		var athleteResponse = request("GET", "https://www.strava.com/api/v3/athlete", {
			headers: {
				Authorization: "Bearer " + accessToken
			}
		});

		var athletePayload = JSON.parse(athleteResponse.getBody());

		var activityList = [];
		var page = 1;
		var isMore = true
		while(isMore) {
			var activitiesResponse = request("GET", "https://www.strava.com/api/v3/"
				+ "activities?per_page=25&page="+page+"&after="+config.startDate, {
				headers: {
					Authorization: "Bearer " + accessToken
				}
			});
        	var activitiesPayload = JSON.parse(activitiesResponse.getBody());
			activitiesPayload.forEach((activity)=>{
				activityList.push({
					id: activity.id,
					userId: activity.athlete.id,
					distance: activity.distance,
					userName: athletePayload.firstname + " " + athletePayload.lastname,
					startDate: activity.start_date
				});
			});
			isMore = activitiesPayload.length > 0;
			page++;
		}
		console.log(JSON.stringify(activityList));
		//push these to DB and confirm
		return activityList;

	}
}
