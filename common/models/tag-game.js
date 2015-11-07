var app = require('../../server/server.js');
var async = require('async');
var _ = require('underscore');
var Parse = require('parse/node').Parse;
var Tag = Parse.Object.extend("Tag");
var Player = Parse.Object.extend("Player");
Parse.initialize("VeEodLh11HU4otvwIHpl3slzqN21jYFRefHMQPvp", "ja0EMrZH0mdE8TBRFrIXPCA54SYCF1fCgn04uXgI");

module.exports = function(TagGame) {
  function mapGeoPoint(geoPoint) {
    return [geoPoint._latitude, geoPoint._longitude];
  }

  function calculateDomination(tagId, teamId, userId, callback) {
    var query = new Parse.Query(Tag);
    console.log(tagId);
    // query.equalTo('id', tagId);
    query.get(tagId).then(function(result) {
      // Do something with the returned Parse.Object values
      console.log(result);
      if (!result.userId) {
        result.set("userId", userId);
        result.set("teamId", teamId);
        result.save(function(err, data) {
          return callback(err, data);
        });
      }

      if (result.teamId === teamId) {
        console.log('same time Id %j', result);
        return callback(null, true);
      }
      var tagLocation = Tag.get("location");
      var queryPlayerPostion = new Parse.Query(Player);
      var queryPlayerNotTeam = new Parse.Query(Player);
      queryPlayerPostion.withinKilometers("location", tagLocation,0.05);
      queryPlayerNotTeam.notEqualTo("teamId", teamId);
      var mainQuery = Parse.Query.and(queryPlayerPostion, queryPlayerNotTeam);
      mainQuery.count().then(function(count) {
        if (count < 0)
          return callback(null, null);
        var queryPlayerTeam = new Parse.Query(Player);
        queryPlayerTeam.EqualTo("teamId", teamId);

        var mainQuery2 = Parse.Query.and(queryPlayerPostion, queryPlayerNotTeam);
        mainQuery2.count().then(function(countTeam) {
          if (count === countTeam) {
            result.set("userId", null);
            result.set("teamId", null);
          }
          if (count < countTeam) {
            result.set("userId", userId);
            result.set("teamId", teamId);
          }
          return result.save(callback);
        });
      });
    });


    // check if the tag is scan
    // if not win dominate
    // else if is another already,
    // check if they are in radio,
    // and
    // if there are more that other team
    //  capture
    // if there are ===
    // untag
    // if less
    // do nothing
  }

  TagGame.capture = function(tagId, gameId, userId, teamId, res, callback) {

    // Get the tag that has been capture
    var query = {
      where: {
        tagId: tagId,
        gameId: gameId,
        capture: false
      }
    };
    calculateDomination(tagId, teamId, userId, callback);
  };

  TagGame.remoteMethod(
    'capture', {
      accepts: [{
        arg: 'tagId',
        type: 'string'
      }, {
        arg: 'gameId',
        type: 'string'
      }, {
        arg: 'userId',
        type: 'string'
      }, {
        arg: 'teamId',
        type: 'string'
      }, {
        arg: 'res',
        type: 'object',
        'http': {
          source: 'res'
        }
      }],
      returns: {
        arg: 'found',
        type: 'object'
      }
    }
  );

};
