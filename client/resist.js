// Initialize Angular app
var app = angular.module('resist', ['uuid4']);

// Models
function Game(id) {
	this.id = id;
	this.log = [];
	this.started = new Date();
	this.rule = undefined;
	this.players = [];
	this.spies = [];
	this.soldiers = [];
	this.missions = [];
	this.currentPhase = 'menu';
	this.currentView = 'handing';
	this.currentMission = 0;
	this.currentPlayer = 0;
	this.currentLeader = undefined;
	this.nextLeader = undefined;
	this.changedLeader = 0;
	this.score = {
		resistance: 0,
		governement: 0
	};
	this.result = undefined;
}

function Player(name, order) {
	this.id = name;
	this.name = name;
	this.order = Player.counter;
	this.isSpy = false;
	Player.counter++;
}
Player.counter = 0;

function Mission(id, teamSize) {
	this.id = id;
	this.num = this.id + 1;
	this.teamSize = teamSize;
	this.team = [];
	this.sabotages = 0;
}

// Main controller
app.controller('GameController', function(uuid4) {
	
	// New player placeholder var
	this.newPlayer = new Player();
	
	// Log
	this.gamelog = [];
	this.log = function(msg) {
		console.log(msg);
		this.game.log.push({ message: msg, date: new Date() });
	};
	
	// Start a new game
	this.start = function() {
		this.game = new Game(uuid4.generate());
		this.log('Game started');
		
		this.game.currentPhase = 'setPlayers';
		$('#setPlayers').find('input').focus();
		
		this.save();
	};
	
	// Save current game
	this.save = function() {
		localStorage.game = angular.toJson(this.game);
	};
	
	// Resume a saved game
	this.resume = function() {
		if (localStorage.game) {
			this.game = JSON.parse(localStorage.game);
			this.log('Game resumed');
		}
		else {
			alert('No saved game !');
		}
	};
	
	// Add a player
	this.addPlayer = function() {
		this.newPlayer.id = uuid4.generate();
		this.game.players.push(this.newPlayer);
		this.log('Added player '+this.newPlayer.name);
		this.newPlayer = new Player();
		
		this.save();
	};
	
	this.nextPlayer = function() {
		this.game.currentPlayer++;
		if (this.game.currentPlayer == this.game.players.length)
		{
			this.game.currentPlayer = 0;
		}
	};
	
	this.addSoldier = function(soldier) {
		var ctrl = this;
		
		if (ctrl.game.currentMission.team.length >= ctrl.game.currentMission.teamSize) {
			alert('Team is full !');
			return false;
		}
		
		// Add to the team
		soldier.order = ctrl.game.currentMission.team.length;
		ctrl.game.currentMission.team.push(soldier);
		
		// Remove from available soldiers
		$.each(this.game.soldiers, function(index, item) {
			if (item.id == soldier.id) {
				ctrl.game.soldiers.splice(index, 1);
				return false;
			}
		});
		
	};
	
	this.removeSoldier = function(soldier) {
	
		var ctrl = this;
		
		// Add to available soldiers
		ctrl.game.soldiers.push(soldier);
		
		// Remove from the team
		$.each(this.game.currentMission.team, function(index, item) {
			if (item.id == soldier.id) {
				ctrl.game.currentMission.team.splice(index, 1);
				return false;
			}
		});
		
	};
	
	this.nextLeader = function() {
		
		if (this.game.changedLeader >= 5) {
			this.log('The resistance ran out of leader. The governement wins.');
			this.endGame('The resistance ran out of leader. The governement wins.');
		} 
		else 
		{
		
			// Set the new current Leader
			this.game.currentLeader = this.game.nextLeader;
			this.log('Changing leader to '+this.game.currentLeader.name);
			
			// Set the new next Leader
			var nextLeaderKey = this.game.currentLeader.order + 1;
			nextLeaderKey = (nextLeaderKey == this.game.players.length) ? 0 : nextLeaderKey;
			this.game.nextLeader = this.game.players[nextLeaderKey];
			
			this.game.changedLeader++;
			
			this.save();
		}
	};
	
	// Set rule & spies
	this.setSpies = function() {
		
		var game = this.game;
		
		// Choose rule according to number
		game.rule = rules[game.players.length];

		// Create each game mission
		for (var i = 0; i < 5; i++) {
			game.missions.push(new Mission(i, game.rule.missions[i]));
		}
		
		// Set spies
		var spyCount = 0, spies = [];
		while (spyCount < game.rule.spies) {
			var key = Math.floor(Math.random() * game.players.length);
			if (!game.players[key].isSpy) {
				this.game.players[key].isSpy = true;
				this.game.spies.push(this.game.players[key].name);
				spyCount++;
			}
		}
		
		this.log('Randomly picked '+this.game.rule.spies+' spies: '+this.game.spies.join());
		
		// Setting game start params
		this.game.currentMission = this.game.missions[0];
		this.game.currentLeader = this.game.players[0];
		this.game.nextLeader = this.game.players[1];
		
		this.showRoles();
	};
	
	this.showRoles = function() {
		
		this.game.currentPhase = 'showRoles';
		this.game.currentView = 'handing';
		this.game.currentPlayer = 0;
		
		this.save();
		
	};
	
	this.prepareMission = function() {
		
		var game = this.game;
		
		// Clone players array
		game.soldiers = game.players.slice(0);
		
		game.currentPhase = "prepareMission";
		game.currentView = "teamVote";
		
		this.save();
	};
	
	this.doMission = function() {
		
		var game = this.game,
			mission = game.currentMission;
		
		this.log('Doing mission '+mission.num);
		
		game.currentPhase = "doMission";
		game.currentView = "handing";
		
		game.currentSoldier = mission.team[0];
			
		this.save();
	};
	
	this.missionVote = function(sabotage) {
		
		var game = this.game,
			mission = game.currentMission;
		
		if (sabotage) {
			this.log(game.currentSoldier.name+" choose to sabotage mission "+mission.num+".");
			mission.sabotages++;
		}
		
		// Go to next soldier;
		var nextSoldierKey = game.currentSoldier.order + 1;
		game.currentSoldier = mission.team[nextSoldierKey];
		
		if (game.currentSoldier) {
			game.currentView = "handing";
		} else {
			// Show mission outcome
			if (mission.sabotages) {
				game.score.governement++;
			}
			else {
				game.score.resistance++;
			}
			game.currentPhase = "missionResult";
		}
		
		this.save();
	};
	
	this.nextMission = function() {
	
		var game = this.game,
			mission = game.currentMission;
			nextMissionId = mission.id + 1;
		
		if (game.score.governement >= 3) {
			this.endGame('Three missions failed. The governement wins.');
		}
		else if (game.score.resistance >= 3) {
			this.endGame('Three missions have succeeded. The resistance wins.');
		}
		else {
			game.currentMission = game.missions[nextMissionId];
			this.prepareMission();
		}
		
	};
	
	this.endGame = function(result) {
		this.log(result);
		this.game.currentPhase = "gameOver";
		this.game.result = result;
		
		this.save();
	};
});

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
};
