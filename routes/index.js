exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.users = function(req, res){
  res.send('users');
};