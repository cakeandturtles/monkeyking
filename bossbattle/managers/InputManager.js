function InputManager(key_manager){
	this.key_manager = key_manager;
}
InputManager.LEFT = KeyManager.LEFT;
InputManager.RIGHT = KeyManager.RIGHT;
InputManager.JUMP = KeyManager.Z;
InputManager.RELEASE = KeyManager.X;
InputManager.PAUSE = KeyManager.ENTER;

InputManager.prototype.Update = function(player){
	if (document.activeElement.tagName === "TEXTAREA") return;
	
	if (this.key_manager.keys_pressed[InputManager.PAUSE]){
		paused = true;
		this.key_manager.keys_pressed[InputManager.PAUSE] = false;
		pause_text = "GAME IS PAUSED";
	}

	//ARROW KEYS MANAGEMENT
	if (this.key_manager.keys_down[InputManager.RIGHT]){
		if (!player.frozen) player.MoveRight();
	}
	else if (this.key_manager.keys_down[InputManager.LEFT]){
		if (!player.frozen) player.MoveLeft();
	}
	
	if (this.key_manager.keys_pressed[InputManager.JUMP]){
		if (!player.frozen && room.player.y > 0){
			if (!player.has_wings){
				if (player.on_ground)
					Utils.playSound("jump", master_volume);
			}else{
				Utils.playSound("LOZ_Boomerang");
			}
			player.StartJump();
		}
	}
	else if (this.key_manager.keys_down[InputManager.JUMP]){
		if (!player.frozen) player.Jump();
	}
	if (this.key_manager.keys_up[InputManager.JUMP]){
		if (!player.frozen) player.StopJump();
	}
	
	if (this.key_manager.keys_pressed[InputManager.RELEASE]){
		room_manager.StartReleasingCritters();
	}else if (this.key_manager.keys_down[InputManager.RELEASE]){
		room_manager.ReleaseCritters();
		player.vel.y = 0;
		player.vel.x = 0;
		player.move_state = MoveState.FALLING;
		
		if (player.has_wings){
			player.grav_acc = 0.1;
		}
	}else if (this.key_manager.keys_up[InputManager.RELEASE]){
		room_manager.StopReleasingCritters();
		room.camera.temp_monkey = null;
	}
	
	//RESTART THE GAME
	if ((this.key_manager.keys_pressed[KeyManager.SHIFT] && this.key_manager.keys_down[KeyManager.R]) || (this.key_manager.keys_down[KeyManager.SHIFT] && this.key_manager.keys_pressed[KeyManager.R])){
		//InputManager.RestartGame();
		click_to_start = true;
		paused = false;
	}
	
	if (this.key_manager.keys_pressed[KeyManager.K]){
		room_manager.anna_cheat_code = true;
	}else{
		room_manager.anna_cheat_code = false;
	}
}

InputManager.RestartGame = function(){
	room_manager.Restart();
	room = room_manager.GetRoom();

	console.log("start");
	//Let's play the game!
	then = Date.now();
}