var app = require('../../server/server.js');
var async = require('async');
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
        arg: 'gameId',
        type: 'string'
      }, {
        arg: 'gameId',
        type: 'string'
      }, {
        arg: 'team',
        type: 'string'
      }],
      returns: {
        arg: 'greeting',
        type: 'string'
      }
    }
  );


  Game.createNew = function(teams, callback) {
    // Get ramdom Tags
    var tags = [{
      tagId: '1',
      name: 'tag1',
      geoPoint: [1, 1],
      capture: false
    }];
    // Create the game
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

  };

  Game.remoteMethod(
    'createNew', {
      accepts: {
        arg: 'gameId',
        type: 'string'
      },
      returns: {
        arg: 'gameId',
        type: 'string'
      },
      http: {
        path: '/createNew',
        verb: 'post'
      }
    }
  );



};
