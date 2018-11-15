var mongoose = require('mongoose');

var activitySchema = new mongoose.Schema({
  activityId: {
  	type: String,
	index: { unique: true}
  },
  userId: String,
  username: String,
  distance: Number,
  startDate: String
});

var Activity = mongoose.model('Activity', activitySchema);

module.exports = {
	addActivities: function(activities) {
		if(activities) {
			activities.forEach(function(activity){
				var myActivity = new Activity({
					activityId: activity.id,
					userId: activity.userId,
					username: activity.userName,
					distance: activity.distance,
					startDate: activity.startDate
				});
				myActivity.save((err, myActivity) => {if(err) console.error(err)});
			});
		}
	},
	getActivities: function(callback) {
		 Activity.find({}, function(err, activities){
		 	if (err) {
				return console.error(err);
			}
			else {
				callback(activities);
			}
		 });
	}
};
