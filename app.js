var axios = require('axios');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var admin_token = 'ea45c0e724b76558e4a7743ee0ff10ebc1232d3a';
var bot_token = 'xoxb-951825791648-942979843825-ne4cYH0eW5mi80R05W5QeMMT';
var port = process.env.PORT || 1337;

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(request, result) {
	result.status(200).send('Hello World!');
});

app.listen(port, function() {
	console.log('Listening on port ' + port);
});


function get_email_from_user_id(user_id) {
	return axios.get(`https://slack.com/api/users.info?token=` + bot_token + `&user=` + user_id).then(result => {
		return result.data.user.profile.email;
	})
}

function check_registered(email) {
	var headers = {
          "Authorization": "Token " + admin_token
    };
	return axios.post(`https://lets-meet-backend.herokuapp.com/admin/token/`, {
		'email': email
	}, {headers: headers}).then(result => {
		token = result.data.token;
		return token;
	},
	error => {
		throw error();
	})
}

function post_backend_request(url, data, token) {
	var headers = {
		"Authorization": "Token " + token
	}
	return axios.post('https://lets-meet-backend.herokuapp.com/' + url, data, {headers: headers}).then(result => {
		return result;
	},
	error => {
		throw error();
	})
}

function get_backend_request(url, token) {
	var headers = {
		"Authorization": "Token " + token
	}
	return axios.get('https://lets-meet-backend.herokuapp.com/' + url, {headers: headers}).then(result => {
		return result;
	},
	error => {
		throw error();
	})
}

app.post('/propose-meet', function(request, result, next) {
	user_id = request.body.user_id;
	response_url = request.body.response_url;
	get_email_from_user_id(user_id).then(email => {
		check_registered(email).then(token => {
			var headers = {
				'Content-Type': 'application/json'
			}
			s = request.body.text;
			s = s.split("'");
			title = s[1];
			description = s[3];
			post_backend_request('meets/propose/', {
			  "title": title,
			  "description": description,
			  "is_slack": true
			}, token).then(result => {
				meet_id = result.data.id;
				axios.post(response_url, {'text': 'The meet has been successfully created with id ' + meet_id + '. Please add some members to the meet.'}, {headers: headers})
			})
		},
		error => {
			var headers = {
				'Content-Type': 'application/json'
			}
			axios.post(response_url, {'text': 'You are not registered on Let\'s meet. Please visit https://lets-meet-web-app.herokuapp.com/ to register.'}, {headers: headers})
		});
	});

	return result.status(200).end();
})

app.post('/view-meet', function(request, result, next) {
	user_id = request.body.user_id;
	response_url = request.body.response_url;
	get_email_from_user_id(user_id).then(email => {
		check_registered(email).then(token => {
			var headers = {
				'Content-Type': 'application/json'
			}
			meet_id = request.body.text;
			get_backend_request('meets/'+ meet_id +'/', token).then(result => {
				meet_id = result.data.id;
				title = result.data.description;
				description = result.data.description;
				minutes = result.data.minutes;
				is_accepted = result.data.is_accepted;
				zoom_link = result.data.zoom_link;
				organizer = result.data.creator;
				members = result.data.members;
				date_and_time = result.data.date_and_time;
				duration = result.data.duration;
				axios.post(response_url, {'text': 'Meet details:\nId: ' + meet_id +'\nTitle: ' + title
										   + '\nDescription: ' + description + '\nMinutes: ' + minutes + '\nFinalized: ' + is_accepted
										   + '\nZoom Room: ' + zoom_link + '\nOrganizer: ' + organizer + '\nMembers: ' + members + '\nStart Date and Time: ' + date_and_time + '\nDuration: ' + duration + 'hrs'}, {headers: headers})
			})
		},
		error => {
			var headers = {
				'Content-Type': 'application/json'
			}
			axios.post(response_url, {'text': 'You are not registered on Let\'s meet. Please visit https://lets-meet-web-app.herokuapp.com/ to register.'}, {headers: headers})
		});
	});

	return result.status(200).end();
})