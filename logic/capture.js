var _ = require('underscore');
var async = require('async');
var Parse = require('parse/node').Parse;
var Tag = Parse.Object.extend("Tag");
var Player = Parse.Object.extend("Player");
var Team = Parse.Object.extend("Team");
var User = Parse.Object.extend("User");

Parse.initialize("VeEodLh11HU4otvwIHpl3slzqN21jYFRefHMQPvp", "ja0EMrZH0mdE8TBRFrIXPCA54SYCF1fCgn04uXgI");

function saveTagPerUser(tags) {
  async.each(tags, function(tag, cb) {
    var query = new Parse.Query(Player);
    var relation = query.relation("user").query();
    relation.first({
      success: function (user) {
        user.set('totalTags', tags.length);
        user.save();
      }
    });
  });
}

function checkWinner(gameId, callback) {
  var query = new Parse.Query(Tag);
  query.find({
    success: function(tags) {
      var teamsScore = _.groupBy(tags, 'team');
      for (var key in teamsScore) {
        if (teamsScore[key].length > tags.length / 2) {
          saveTagPerUser(tags);
          return callback(null, teamsScore[key]);
        }
      }
      callback(null, null, null);
    },
    error: function(err) {
      callback(err, null, null);
    }
  });
}

function calculateDomination(tagId, teamId, userId, callback) {
  console.log('start');
  var query = new Parse.Query(Tag);
  // query.equalTo('id', tagId);
  query.get(tagId, function(result) {
    // Do something with the returned Parse.Object values
    //
    console.log(result);
    if (!result) return callback(null, null);
    if (!result.userId) {
      result.set("user", userId);
      result.set("team", teamId);
      result.save(function(err, data) {
        return callback(err, data);
      });
    }

    if (result.teamId === teamId) {
      return callback(null, true);
    }
    var tagLocation = result.location;
    var queryNotTeam = new Parse.Query(Player);


    queryNotTeam.withinKilometers("location", tagLocation, 0.05);
    queryNotTeam.notEqualTo("team", teamId);

    queryNotTeam.count().then(
      function(count) {
        console.log('pura vide', count);
        if (!count) {
          console.log('no change');
          return callback(null, 'no change');
        }

        var queryTeamMembers = new Parse.Query(Player);
        queryTeamMembers.withinKilometers("location", tagLocation, 0.05);
        queryTeamMembers.equalTo("teamId", teamId);

        queryTeamMembers.count({
          success: function(countTeam) {
            if (count === countTeam) {
              result.set("player", null);
              result.set("team", null);
            }
            if (count < countTeam) {
              var queryTeam = new Parse.Query(Team);
              queryTeam.get(teamId, function(err, data) {
                result.set("player", userId);
                result.set("team", data);
                return result.save(callback);
              });
            }
            return result.save(callback);
          }
        });
      });
  });
}

function capture(req, resp) {
  console.log(req.body.tagId, req.body.teamId, req.body.userId);
  calculateDomination(req.body.tagId, req.body.teamId, req.body.playerId, function(err, data) {
    console.log(data);
    if (err || !data)
      return resp.status(403).end();
    checkWinner(req.body.gameId, function(err, winnerTeam) {
      if (winnerTeam) return resp.send({
        winner: winnerTeam
      });
      return resp.send(data);
    });

  });
}
module.exports = {
  capture: capture
};
