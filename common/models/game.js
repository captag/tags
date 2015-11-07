var app = require('../../server/server.js');
var async = require('async');
var _ = require('underscore');
var Parse = require('parse/node').Parse;

Parse.initialize("VeEodLh11HU4otvwIHpl3slzqN21jYFRefHMQPvp", "ja0EMrZH0mdE8TBRFrIXPCA54SYCF1fCgn04uXgI");

module.exports = function(Game) {

  Game.join = function(userId, gameId, team, callback) {
    var userGame = {
      userId: userId,
      gameId: gameId,
      team: team
    };
    app.models.UserGame.create(userGame, callback);
  };

  Game.remoteMethod(
    'join', {
      accepts: [{
        arg: 'userId',
        type: 'string'
      }, {
        arg: 'gameId',
        type: 'string'
      }, {
        arg: 'team',
        type: 'string'
      }],
      returns: {
        arg: 'user',
        type: 'string'
      }
    }
  );


  function mapGeoPoint(geoPoint) {
    return [geoPoint._latitude,geoPoint._longitude];
  }

  Game.createNew = function(teams, callback) {
    // Get ramdom Tags
    var query = new Parse.Query(Parse.Object.extend("Tag"));
    var tags = [];
    async.waterfall([
      function(cb) {
        query.find().then(
          function(tagsParse) {
            for (var i = 0; i < tagsParse.length; ++i) {
              var geoPunt = tagsParse[i].get('geoPoint');

              tags.push({
                tagId: tagsParse[i].id,
                name: tagsParse[i].get('label'),
                geoPoint: mapGeoPoint(geoPunt),
                capture: false
              });
            }
            cb(null, tags);
          }
        );
      },
      function(tags, cb) {
        var newGame = {
          teams: teams
        };
        Game.create({
          teams: teams
        }, function(err, game) {
          var asingTags = tags.map(function(tag) {
            tag.gameId = game.id;
            return tag;
          });
          async.map(asingTags, function(tag, cb) {
            app.models.TagGame.create(tag, cb);
          }, callback);
        });
      }
    ], callback);


    // Create the game


  };

  Game.remoteMethod(
    'createNew', {
      accepts: {
        arg: 'teams',
        type: 'array'
      },
      returns: {
        arg: 'gameTags',
        type: 'string'
      },
      http: {
        path: '/createNew',
        verb: 'post'
      }
    }
  );


  function aggregateTeamsTags(result) {
    var teamUsers = _.groupBy(result, 'team');
    var teams = [];
    for (var key in teamUsers) {
      var teamTags = _.reduce(teamUsers[key], function(memo, user) {
        return memo.concat(user.tagsCaptured);
      }, []);
      teams.push({
        name: key,
        tags: teamTags
      });
    }
    return teams;

  }

  Game.getLeaderBoard = function(gameId, callback) {

    async.waterfall([
      function(cb) {
        app.models.UserGame.find({
          where: {
            gameId: gameId
          }
        }, cb);
      },
      function(users, cb) {
        async.map(users, function(user, next) {
          var query = {
            where: {
              userId: user.id
            }
          };
          app.models.TagGame.find(query, function(err, tags) {
            next(err, {
              userId: user.id,
              userName: '',
              team: user.team,
              tagsCaptured: tags
            });
          });
        }, cb);
      }
    ], function(err, result) {
      var teams = aggregateTeamsTags(result);
      var leaderBoard = {
        gameId: gameId,
        users: result,
        teams: teams
      };
      callback(err, leaderBoard);
    });
  };

  Game.remoteMethod(
    'getLeaderBoard', {
      accepts: {
        arg: 'gameId',
        type: 'string'
      },
      returns: {
        arg: 'gameId',
        type: 'string'
      },
      http: {
        path: '/getLeaderBoard',
        verb: 'post'
      }
    }
  );


};
