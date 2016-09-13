var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

const Config = require('./config.js');

var app = express();


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));


// Server frontpage
app.get('/', function (req, res) {
    res.send('This is messenger test Bot');
});


//set up webhook

app.get('/webhook', function (req, res) {
	if(!Config.FB_VERIFY_TOKEN){
		throw new Error('missing FB_VERIFY_TOKEN')
	}
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] == Config.FB_VERIFY_TOKEN){
		console.log("validating webhook");
		res.status(200).send(req.query['hub.challenge']);
	} else {
		res.sendStatus(403)
	}
});

// request.post({
	// uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
    // qs: {access_token: Config.FB_PAGE_TOKEN},
    // method: 'POST',
    // json: {
		// setting_type: "greeting",
		// greeting: {
			// text : "welcome"
		// }
	// }
// }, function (error, response, body) {
    // if (!error && response.statusCode == 200) {
      

      // console.log("Successfully sent greeting message");
    // } else {
      // console.error("Unable to send greeting message.");
      // console.error(response);
      // console.error(error);
    // }
// });  



app.post('/webhook', function(req, res){
	
	
	request.post({
    method: 'POST',
    uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: {access_token: Config.FB_PAGE_TOKEN},
	json:{
		setting_type: "call_to_actions",
        thread_state: 'new_thread',
        call_to_actions: [
			{
                payload: 'GET_START'
            }
		]
	}
}, (err, res, body) => {
    // Deal with the response
});
	var data = req.body;
	console.log('data ' + data);
	if (data.object =='page'){
	
	data.entry.forEach(function(pageEntry){
		var pageID = pageEntry.id;
		var timeOfEvent = pageEntry.time;
		
		pageEntry.messaging.forEach(function(messagingEvent){
		 if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          console.log(messagingEvent.delivery);
		  // receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });
	res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log('message : ' + JSON.stringify(message));

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
	  console.log(messageText);

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
		case 'bonjour': 
		sendHelloWordMessage(senderID);
		break;
		
      case 'quickreplies':
        sendQuickReplies(senderID, 'Bonjour');
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}



function sendQuickReplies(recipientId, messageText)
{
	var messageData = 
	{
		recipient : 
		{
			id : recipientId
		},
		message : 
		{
		text : "choose something : ",
		quick_replies : 
			[
				{
					content_type : "text", 
					title : "Red",
					payload: "payload for first thing"
				},
				{
					content_type: "text",
					title: "Blue",
					payload: "paload for second thing"
				}
			]
		}
	};
callSendAPI(messageData)
	
}
	

function sendTextMessage(recipientId, messageText) {
	console.log(recipientId);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}


function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: Config.FB_PAGE_TOKEN},
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      //console.error(response);
      //console.error(error);
    }
  });  
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}
