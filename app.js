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

// getPolls() {
//   var headers = {
//       "Content-Type": "application/json",
//       Authorization: "Token " + this.token
//     };
//   axios.get(`https://pollswrp.herokuapp.com/polls/`,{headers:headers}).then(result => {
//     this.response = result.data;
//     if (this.response.participated.length === 0 ) {
//       this.participated_null = true;
//     }
//     if (this.response.created.length === 0 ) {
//       this.created_null = true;
//     }
//   })
// }

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

	// var userName = request.body.user_name;
	// var botPayload = {
	// 	text: 'Hello ' + userName + ', welcome to this Test Bot' + request.body.user_id + request.body.text + ' ' + request.body.response_url
	// };

	// if (userName !== 'slackbot') {
	// 	return result.status(200).json(botPayload);
	// } else {
	// 	return result.status(200).end();
	// }
})