exports.index = function(db) {
  return function(req, res) {
    var collection = db.get('users');
    collection.find({},function(e,docs){
      res.render('index', { users: docs });
    });
  };
};