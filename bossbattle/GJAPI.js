function GJAPI(){}

GJAPI.game_id = "30320";
GJAPI.private_token = "22b2d6df2fe33d574b37970c77fb3b64";

GJAPI.authorize = function(username, user_token, callback){
	var url = "http://gamejolt.com/api/game/v1/users/auth/?game_id=" + GJAPI.game_id + "&username=" + username + "&user_token=" + user_token;
	var signature = url + GJAPI.private_token;
	signature = md5(signature);
	url = url + "&signature=" + signature;
	
	var timeoutCallback = (function(url){
		var xmlhttp = Utils.GetXMLHttpRequest();
		xmlhttp.onreadystatechange=function(){
			if (xmlhttp.readyState===4 && xmlhttp.status===200){
				console.log(xmlhttp.responseText);
				if (xmlhttp.responseText.match("success:\"true\"") !== null){
					callback(true);
				}else{
					callback(false);
				}
			}
		}
		xmlhttp.open("POST", url, true);
		//Send the proper header information along with the request
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send();
	})(url);
	
	setTimeout(timeoutCallback, 0);
}