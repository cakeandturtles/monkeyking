function Utils(){}

//http://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
Utils.createCookie = function(name,value,days) {
	console.log("writing: " + value);
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

Utils.readCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

Utils.eraseCookie = function(name) {
    createCookie(name,"",-1);
}

Utils.gup = function(name){
	//http://stackoverflow.com/questions/8460265/get-a-variable-from-url-parameter-using-javascript
	name = RegExp ('[?&]' + name.replace (/([[\]])/, '\\$1') + '=([^&#]*)');
	return (window.location.href.match (name) || ['', ''])[1];
}

Utils.playSound = function(sound_name, volume, time, loop){
	tryToPlay = null;
	loop = defaultValue(loop, false);

	if (!resource_manager.can_play_sound || (!resource_manager.play_sound || (!resource_manager.play_music && loop))) 
		return;
	//if the bg music isn't loaded, give it a second
	if (loop){
		if (resource_manager[sound_name] === undefined || resource_manager[sound_name] === null){
			tryToPlay = window.setTimeout(function(){bg_music = Utils.playSound(sound_name, volume, time, loop);}, 1000);
			console.log("TRY TO PLAY:" +sound_name);
			return;
		}
	}
	
	if (!resource_manager[sound_name]) return;

	//http://www.html5rocks.com/en/tutorials/webaudio/intro/
	var source = resource_manager.audio_context.createBufferSource(); //creates a sound source
	source.buffer = resource_manager[sound_name]; //tell the source which sound to play
	source.loop = loop;
	
	var v = volume || 1.0;
	//Create a gain node
	var gain_node = resource_manager.audio_context.createGain();
	source.connect(gain_node);
	gain_node.connect(resource_manager.audio_context.destination); //connect source to the speakers
	
	//Set the volume
	gain_node.gain.value = v;

	
	var t = time || 0;
	if (source.start)
		source.start(t); 
	//NOTE: on older systems, may have to use deprecated noteOn(time);
	else
		source.noteOn(t);
		
	return source;
}

Utils.GetXMLHttpRequest = function(){
	var xmlhttp;
	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	return xmlhttp;
}

Utils.readTextFileAsync = function(file, callback){
	var rawFile = Utils.GetXMLHttpRequest();
	try{
		rawFile.open("GET", file, true);
		rawFile.onreadystatechange = function (){
			if(rawFile.readyState === 4){
				if(rawFile.status === 200 || rawFile.status == 0){
					callback(rawFile.responseText);
				}else{
					callback(null);
				}
			}
		}
		rawFile.send(null);
	}catch(e){
	}
}

//http://stackoverflow.com/questions/3808808/how-to-get-element-by-class-in-javascript
Utils.getElementsByClass = function(matchClass) {
    var elems = document.getElementsByTagName('*'), i;
	var class_objects = [];
    for (i in elems) {
        if((' ' + elems[i].className + ' ').indexOf(' ' + matchClass + ' ')
                > -1) {
            class_objects.push(elems[i]);
        }
    }
	return class_objects;
}

//http://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
function extend(base, sub){
	// Avoid instantiating the base class just to setup inheritance
	// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
	// for a polyfill
	// Also, do a recursive merge of two prototypes, so we don't overwrite 
	// the existing prototype, but still maintain the inheritance chain
	// Thanks to @ccnokes
	var origProto = sub.prototype;
	sub.prototype = Object.create(base.prototype);
	for (var key in origProto)  {
		sub.prototype[key] = origProto[key];
	}
	// Remember the constructor property was set wrong, let's fix it
	sub.prototype.constructor = sub;
	// In ECMAScript5+ (all modern browsers), you can make the constructor property
	// non-enumerable if you define it like this instead
	Object.defineProperty(sub.prototype, 'constructor', { 
		enumerable: false, 
		value: sub 
	});
}

function $(id){
    return document.getElementById(id);
}

function defaultValue(variable, def_val){
	return typeof variable !== 'undefined' ? variable : def_val;
}

function sharpen(ctx){
	ctx.imageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
}

function drawLine(ctx, color, x1, y1, x2, y2, thickness, cap){
    cap = cap || "round";
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.lineCap = cap;
    ctx.stroke();
}

//http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}