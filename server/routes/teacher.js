'use strict';

let express = require('express');
let auth = require('../middleware/auth');
let teacherRouter = express.Router();
let Teacher = require('../models/teacher');
let Videos = require('../models/videos');
let Student = require('../models/student');
const chalk = require('chalk');

// authentication middleware
teacherRouter.use((req, res, next) => {
	auth.authenticate(req, res, next, 'teacher');
});

/*
	GET /teacher
	response: view with variables { user (username) }
*/
teacherRouter.get('/', (req, res) => {
	console.log(chalk.green('GET ' + chalk.blue('/teacher')));
	res.render('teacher_dashboard.ejs', {
		user: req.user
	});
});

/*
	GET /teacher/details
	response: json { success (boolean), name, email, username }
*/
teacherRouter.get('/details', (req, res) => {
	console.log('GET /teacher/details');
	Teacher.findOne({
		username: req.user.username
	}, (err, teacher) => {
		if (err) throw err;
		if (teacher == null) return res.json({
			success: false
		});
		res.json({
			success: true,
			name: teacher.name,
			email: teacher.email,
			username: teacher.username
		});
	});
});

/*
	GET /teacher/videos
	response: json { success (boolean), videos { name, link } }
*/
teacherRouter.get('/videos', (req, res) => {
	console.log('GET /teacher/videos');
	Videos.find().populate({
		path: 'postedBy',
		match: {
			username: req.user.username
		}
	}).exec((err, videos) => {
		if (err) throw err;
		if (videos == null) return res.json({
			success: false
		});
		let vids = [];
		for (let i = 0; i < videos.length; i++) {
			vids.push({
				name: videos[i].name,
				link: videos[i].link
			});
		}
		res.json({
			success: true,
			videos: vids
		});
	});
});

/*
	POST /teacher/addVideo
	request body: json { name, link }
	response: json { success (boolean), name, link }
*/
teacherRouter.post('/addVideo', (req, res) => {
	console.log('POST /teacher/addVideo');
	Teacher.findOne({
		username: req.user.username
	}).populate('students').exec((err, teacher) => {
		if (err) throw err;
		if (teacher == null) return res.json({
			success: false
		});
		let video = new Videos({
			name: req.body.name,
			link: req.body.link,
			postedBy: teacher
		});
		video.save((err, result) => {
			if (err) {
				console.log(err);
				return res.json({
					success: false
				});
			}
			for (let i = 0; i < teacher.students.length; i++) {
				Student.findOneAndUpdate({
					username: teacher.students[i].username
				}, {
					$push: {
						videos: result
					}
				}, (err, updatedStudent) => {
					if (err) throw err;
				});
			}
		});
		res.json({
			success: true,
			name: video.name,
			link: video.link
		});
	});
});

/*
	POST /teacher/deleteVideo
	request body: json { link }
	response: json { success (boolean) }
*/
teacherRouter.post('/deleteVideo', (req, res) => {
	console.log('POST /teacher/deleteVideo');
	Videos.deleteOne({
		link: req.body.link
	}, (err) => {
		if (err) {
			console.log(err);
			res.json({
				success: false
			});
		}
		res.json({
			success: true
		});
	});
});

module.exports = teacherRouter;