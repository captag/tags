/**
 * Testing libraries
 */
var chai = require('chai');
var assert = chai.assert;
var lt = require('loopback-testing');
/**
 * Custom libraries
 */
var app = require('../server/server.js');
// app.listen(3330);


describe('game',function () {
  it('create a game', function (done) {
    var teams =['team1', 'team2'];
    app.models.Game.createNew(teams, function (err, game) {
      var query = {
        where:{
          gameId: game.Id
        }
      };
      app.models.TagGame.find(query, function (err, tags) {
        assert.equal(1, tags.length);
        assert.equal(false, tags[0].capture);

        done();
      });
    });
  });
});
