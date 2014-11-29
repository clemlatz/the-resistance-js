function Game() {
	this.players = [];
	this.started = new Date();
	this.phase = "start";
	this.rule = undefined;
}

Game.prototype = {
	start: function() {
	
		// Prompt for number of player
		var numPlayers = 0
		while (numPlayers < 5 || numPlayers > 10) {
			numPlayers = prompt("How many players?", 5);
		}
		
		
		// Choose rule according to number
		this.rule = rules[numPlayers];
		
		// Get each player's name
		var name = undefined;
		for (var i = 0; i < numPlayers; i++) {
			name = prompt("What is your name, player "+(i+1)+"?", "Player"+(i+1));
			this.players.push(new Player(name, i));
		}
		
		// Set spies
		var spyCount = 0;
		while (spyCount < this.rule.spies) {
			var key = Math.floor(Math.random() * this.players.length);
			if (!this.players[key].isSpy) {
				this.players[key].isSpy = true;
				spyCount++;
			}
		}
		
		this.showRoles();
	},
	showRoles: function() {
		
		for (var i = 0, c = this.players.length; i < c; i++) {
			var player = this.players[i];
			var role = player.isSpy ? "Spy" : "Resistant";
			
			alert("Please hand the device to "+player.name+".\nIf you are "+player.name+", press OK.");
			alert(player.name+", your role is: "+role+".\nPress OK before you hand the device.");
		}
		
		this.recognition();
		
	},
	recognition: function() {
		
		alert("Spy recognition phase will begin. Be sure your speaker volume is up and press OK.");
		
		this.main();
		
	},
	main: function() {
	
		
		var nextLeaderKey = 1;
		var leader = this.players[0];
		var nextLeader = this.players[nextLeaderKey];
		
		var success = 0,
			failures = 0;
		
		// 5 mission loop
		for (var missionNumber = 0; missionNumber < 5; missionNumber++) {
			
			var vote = false,
				leadersRemaining = 5;
			
/* 			if (confirm("Exit?")) throw "Game exited"; */
			alert("New mission!\n\nMission "+(missionNumber+1)+" of 5\nLeader: "+leader.name+"\nNext leader: "+nextLeader.name+"\n");
			
			// Vote for leader choice acceptance
			while (!vote) {
				alert(leader.name+", choose "+this.rule.missions[missionNumber]+" soldiers for this mission.");
				var vote = confirm(leader.name+", do the majority of players accept your choice of soldiers for this mission?");
			
				if (!vote) {
				
					leadersRemaining--;
					if(leadersRemaining == 0) 
					{
						alert("Game over! You ran out of leaders. The governement wins.");
						throw "Game over!";
					}
					
					// Change leader & nextLeader
					leader = nextLeader;
					nextLeaderKey++;
					nextLeaderKey = nextLeaderKey == this.players.length ? 0 : nextLeaderKey;
					nextLeader = this.players[nextLeaderKey];
					alert("New leader for mission"+(missionNumber+1)+"\n\nThe new leader is: "+leader.name+"\nNext leader will be: "+nextLeader.name+"\n\nLeaders remaining: "+leadersRemaining);
				}
			}
			
			// Add player to team
			var team = [];
			for (var i = 0; team.length < this.rule.missions[missionNumber]; i++) {
				if (i == this.players.length) i = 0;
				var player = this.players[i];
				if (confirm("Is "+player.name+" in the team for this mission?")) {
					team.push(player);
				}
			}
			
			alert("Mission begins!");
			
			// Each player vote for mission success
			var sabotages = 0;
			for (var i = 0, c = team.length; i < c; i++) {
				var player = team[i];
				alert("Hand the phone to "+player.name+". Press OK if you are "+player.name+".");
				if (confirm(player.name+", do you want to sabotage this mission?") && player.isSpy) {
					sabotages++;
				}
			}
			
			// Mission result
			var missionSuccess = true;
			if (missionNumber == 4 && this.players.length > 6)
			{
				if (sabotages >= 2)
				{
					missionSuccess = false;
				}
			}
			else if (sabotages)
			{
				missionSuccess = false;
			}
			
			if (!missionSuccess) {
				failures++;
				var result = "Failure!";
			} else {
				success++;
				var result = "Success!";
			}
			alert("Mission result: "+result+" ("+sabotages+" sabotages)");
			
			// If the spies have 3 points, they win
			if (failures == 3) {
				alert("Game over! The governement wins.");
				throw "Game over! The resistance wins.";
			}
			
			// Change leader & nextLeader
			leader = nextLeader;
			nextLeaderKey = nextLeaderKey >= this.players.length ? 0 : nextLeaderKey+1;
			nextLeader = this.players[nextLeaderKey];
			
		}
		alert("Game over! The resistance wins.");
	}
}

function Player(name, order) {
	this.name = name;
	this.order = order;
	this.isSpy = false;
}

var rules = {
	5: {
		spies: 2,
		missions: [2, 3, 2, 3, 3]
	},
	6: {
		spies: 2,
		missions: [2, 3, 4, 3, 4]
	},
	7: {
		spies: 3,
		missions: [2, 3, 3, 4, 4]
	},
	8: {
		spies: 3,
		missions: [3, 4, 4, 5, 5]
	},
	9: {
		spies: 3,
		missions: [3, 4, 4, 5, 5]
	},
	10: {
		spies: 4,
		missions: [3, 4, 4, 5, 5]
	}
}

var game = new Game();
















