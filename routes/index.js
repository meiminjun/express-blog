// var express = require('express');
// var router = express.Router();

/* GET home page. */
// router.get('/', function(req, res) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;
var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js');
module.exports = function(app) {
	app.get('/', function(req, res) {
		Post.get(null, function(err, posts) {
			if (err) {
				posts = [];
			}
			res.render('index', {
				title: '主页',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/reg', function(req, res) {
		res.render('reg', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', function(req, res) {
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];

		console.log(password);
		//检验用户两次输入的密码是否一致
		if (password_re != password) {
			req.flash('error', '两次输入的密码不一致！');
			// req.flash('error', '两次输入的密码不一致!'); 
			// console.log("两次方法不一致");
			return res.redirect('/reg'); //返回注册页面
		}

		//生成密码的md5值
		var md5 = crypto.createHash('md5');
		password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});
		//检查用户名是否已经存在
		User.get(newUser.name, function(err, user) {
			if (err) {
				req.flash('error', err);
				consoe.log(err);
				return res.redirect('/');
			}
			if (user) {
				req.flash('error', '用户已经存在！');
				console.log("檢查用戶名出現錯誤" + err);
				return res.redirect('/reg');
			}
			//如果不存在则增加新用户
			newUser.save(function(err, user) {
				if (err) {
					req.flash('error', err);
					// console.log('数据库无重复信息');
					return res.redirect('/reg');
				}
				req.session.user = user;
				req.flash('success', '注册成功！');
				res.redirect('/');
			});
		});
	});

	app.get('/login', function(req, res) {
		res.render('login', {
			title: '登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', function(req, res) { //生成密码的 md5 值
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		//检查用户是否存在
		User.get(req.body.name, function(err, user) {
			if (!user) {
				req.flash('error', '用户不存在!');
				return res.redirect('/login'); //用户不存在则跳转到登录页
			}
			//检查密码是否一致
			if (user.password != password) {
				req.flash('error', '密码错误!');
				return res.redirect('/login'); //密码错误则跳转到登录页
			}
			//用户名密码都匹配后，将用户信息存入 session
			req.session.user = user;
			req.flash('success', '登陆成功!');
			res.redirect('/'); //登陆成功后跳转到主页
		});
	});

	app.get('/post', function(req, res) {
		res.render('post', {
			title: '发表'
		});
	});

	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', '登出成功!');
		res.redirect('/'); //登陆成功后跳转到主页
	});

	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', '未登录');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if (req.session.user) {
			req.flash('eror', '已经登录');
			res.redirect('back');
		}
		next();
	}

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user,
			post = new Post(currentUser.name, req.body.title, req.body.post);
		post.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功!');
			res.redirect('/'); //发表成功跳转到主页
		});
	});
};