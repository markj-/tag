var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var db = req.db;
  var collection = db.get('users');
  collection.find( {}, function( e, docs ) {
    res.render('index', {
      'title' : 'TAG',
      'users': docs
    });
  });
});

module.exports = router;
