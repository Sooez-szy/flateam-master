var models = require('../models');
var User = models.User;
var Task = models.Task;
var Project = models.Project;
var Reply = models.Reply;

exports.index = function(req, res, next) {
  var count;
  var perpage = 15;
  var page = req.query.p ? parseInt(req.query.p) : 1;

  // 获取参与的项目
  User.findOne({_id: req.session.user._id}, function(err, user) {
    if(!err) {
      Project.find({_id: {$in: user.project}}, function(err, project) {
        Task.find({uid: req.session.user._id}, '', {skip: (page - 1)*perpage, limit: perpage, sort: {status: 1, ctime: -1}}, function(err, task) {
          res.render('task/index', {
            title: '任务',
            alias: 'task',
            user: req.session.user,
            task: task,
            project: project,
            count: task.length,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
          });
        });
      });
    }
  });
}

exports.post = function(req, res, next) {
  var count;
  // 获取当前用户参与的项目
  User.findOne({_id: req.session.user._id}, function(err, user) {
    if(!err) {
      Project.find({_id: {$in: user.project}}, function(err, project) {
        res.render('task/post', {
          user: req.session.user,
          list: project,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    }
  });
}

exports.doPost = function(req, res, next) {
  //写入数据库
  var ctime = Math.round(new Date().getTime()/1000);
  var post = new Task({
    pid: req.body.project,
    title: req.body.title,
    uid: req.session.user._id,
    name: req.session.user.name,
    ctime: ctime,
    status: 0,
    personal: 0
  });
  post.save(function(err) {
    if(err) {
      return next(err);
    }
    res.redirect('/task/');
  });
}

exports.doFinish = function(req, res, next) {
  var status;
  Task.findOne({_id: req.params.id}, function(err, task) {
    (task.status == 0) ? status = 1: status = 0;
    Task.update({_id: req.params.id}, {status: status}, function(err, result) {
      if(!err) {
        res.json({
          status: 'success',
          info: {
            status: status,
            personal: task.personal
          }
        });
      } else {
        res.json({
          status: 'error',
          info: {
            status: status,
            personal: task.personal
          }
        });
      }
    });
  });
}

exports.doRemove = function(req, res, next) {
  Task.remove({_id: req.params.id}, function(err, result) {
    if(!err) {
      // 删除任务同时，删除任务的评论
      Reply.remove({post_id: req.params.id}, function(err, result) {
        if(!err) {
          res.json({status: 'success'});
        }
      });
    } else {
      res.json({status: 'error'});
    }
  });
}

exports.forward = function(req, res, next) {
  var id = req.params.id;
  // 获取任务
  Task.findOne({_id: req.params.id}, function(err, task) {
    if(!err) {
      // 获取自己以外的项目成员
      Project.findOne({_id: task.pid}, function(err, project) {
        if(!err) {
          var index = project.member.indexOf(req.session.user._id);
          if(index >= 0) {
            project.member.splice(index, 1);
            User.find({_id: {$in: project.member}}, function(err, member) {
              if(!err) {
                res.render('task/forward', {
                  pid: id,
                  member: member
                });
              }
            });
          }
        }
      });
    }
  });
}

exports.doForward = function(req, res, next) {
  // 更新uid、name、personal
  Task.update({_id: req.params.tid}, {uid: req.params.uid, name:req.params.name, personal: 0}, function(err, result) {
    if(!err) {
      // 生成动态

      // 发送消息
      res.json({status: 'success'});
    } else {
      res.json({status: 'error'});
    }
  });
}

exports.doPersonal = function(req, res, next) {
  var personal;
  Task.findOne({_id: req.params.id}, function(err, task) {
    (task.personal == 0) ? personal = 1: personal = 0;
    Task.update({_id: req.params.id}, {personal: personal}, function(err, result) {
      if(!err) {
        res.json({
          status: 'success',
          info: {
            status: task.status,
            personal: personal
          }
        });
      } else {
        res.json({
          status: 'error',
          info: {
            status: task.status,
            personal: personal
          }
        });
      }
    });
  });
}

exports.show = function(req, res, next) {
  Task.findOne({_id: req.params.id}, function(err, task) {
    var replyOptions = {
      query: {
        post_id: req.params.id
      },
      sort: {
        ctime: -1
      },
      limit: 15
    };
    Reply.getList(replyOptions, function(err, reply) {
      res.render('task/show', {
        task: task,
        reply: reply
      });
    });
  });
}

exports.showReply = function(req, res, next) {
  // Replay.find({});
}

exports.replyPost = function(req, res, next) {
  // 讨论内容写入数据库
  var ctime = Math.round(new Date().getTime()/1000);
  var post = new Reply({
    post_id: req.params.post_id,
    from: 'task',
    uid: req.session.user._id,
    name: req.session.user.name,
    content: req.params.content,
    ctime: ctime,
    status: 0
  });
  post.save(function(err, result) {
    if(err) {
      res.json({
        status: 'error'
      });
    } else {
      res.json({
        status: 'success',
        info: result
      });
    }
  });
}

exports.replyRemove = function(req, res, next) {
  Reply.remove({_id: req.params.id}, function(err) {
    if(!err) {
      res.json({
        status: 'success'
      })
    }
  });
}