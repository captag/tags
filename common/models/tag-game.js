module.exports = function(TagGame) {


  TagGame.capture = function(tagId, gameId, userId, res, callback) {

    var query = {
      where: {
        id: tagId,
        gameId: gameId,
        capture: false
      }
    };
    TagGame.findOne(query, function (err, tag) {

      if (err || !tag) {
        res.status(404);
        return callback(null, false);

      }
        return callback(null, true);
    });
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
        arg: 'res',
        type: 'object',
        'http': {
          source: 'res'
        }
      }],
      returns: {
        arg: 'found',
        type: 'boolean'
      }
    }
  );

};
