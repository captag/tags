var _ = require('underscore');
var async = require('async');
var Parse = require('parse/node').Parse;
var Tag = Parse.Object.extend("Tag");
var Player = Parse.Object.extend("Player");

Parse.initialize("VeEodLh11HU4otvwIHpl3slzqN21jYFRefHMQPvp", "ja0EMrZH0mdE8TBRFrIXPCA54SYCF1fCgn04uXgI");

function calculateDomination(tagId, teamId, userId, callback) {
  var query = new Parse.Query(Tag);
  // query.equalTo('id', tagId);
  query.get(tagId).then(function(result) {
    // Do something with the returned Parse.Object values
    //
    console.log(result);
    if (!result.userId) {
      result.set("userId", userId);
      result.set("teamId", teamId);
      result.save(function(err, data) {
        return callback(err, data);
      });
    }

    if (result.teamId === teamId) {
      return callback(null, true);
    }
    var tagLocation = result.location;
    var queryNotTeam = new Parse.Query(Player);

    // var queryPlayerNotTeam = new Parse.Query(Player);
    queryNotTeam.withinKilometers("location", tagLocation, 0.05);
    queryNotTeam.notEqualTo("teamId", teamId);
    // var mainQuery = Parse.Query.and(queryPlayerPostion, queryPlayerNotTeam);
    queryNotTeam.count().then(function(count) {
      console.log('pura vide', count);
      if (!count) {
        console.log('no change');
        return callback(null, 'no change');
      }

      // var queryPlayerTeam = new Parse.Query(Player);
      // queryPlayerTeam.equalTo("teamId", teamId);
      // queryPlayerTeam.withinKilometers("location", tagLocation, 0.05);

      var queryTeamMembers = new Parse.Query(Player);
      queryTeamMembers.withinKilometers("location", tagLocation, 0.05);
      queryTeamMembers.equalTo("teamId", teamId);

      queryTeamMembers.count({
        success: function(countTeam) {
          if (count === countTeam) {
            result.set("userId", null);
            result.set("teamId", null);
          }
          if (count < countTeam) {
            result.set("userId", userId);
            result.set("teamId", teamId);
          }
          return result.save(callback);
        }
      });
    });
  });
}

function capture(req, resp) {
  calculateDomination(req.body.tagId, req.body.teamId, req.body.userId, function(err, data) {
    if (err || !data)
      return resp.status(403).end();
    return resp.send(data);
  });
}
module.exports = {
  capture: capture
};