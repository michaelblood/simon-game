const COLORS = [];
const PRESSED_COLORS = [];

const PRESS_LENGTH = 500;
const PRESS_INTERVAL = 250;

const Simon = {};

const init = () => {
	Simon.power = false;
	Simon.chain = [];
	Simon.index = 0;
	Simon.play = false;
	Simon.strict = false;
	Simon.lock = true;
	Simon.selected = -1;
	Simon.timers = [];
	Simon.display = null;
};

const reset = () => {
	Simon.play = false;
	Simon.index = 0;
	Simon.chain = [];
	Simon.lock = true;
	Simon.display = null;
	Simon.timers = [];
	Simon.selected = -1;
};

const intro = () => {

};

const generateMove = () => {
	let move = Math.floor(Math.random() * 4);
	let chain = Simon.chain.slice();
	chain.push(move);

	Simon.chain = chain;
	Simon.index = 0;
	displayChain();
};

const displayChain = () => {
	let timers = Simon.timers.slice();
	let timer = setTimeout(boop, 1000);
	timers.push(timer);
	Simon.currentBoops = timers;
};

const boop = (id = 0) => {
	let index = Simon.chain.length;
	if (id === index) {
		setTimeout(() => {
			Simon.lock = false;
		}, PRESS_LENGTH);
		return;
	}
	Simon.selected = Simon.chain[id];
	Simon.playGoodTone(Simon.chain[id]);
	
	let nextBoop = setTimeout(() => boop(id+1), PRESS_INTERVAL + PRESS_LENGTH);
	let endThisBoop = setTimeout(() => {
		Simon.selected = -1;
		Simon.stopGoodTone(Simon.chain[id]);
	}, PRESS_LENGTH);
	
	let timers = Simon.currentBoops.slice();
	timers.push(nextBoop, endThisBoop);
	Simon.currentBoops = timers;
};

const cancelBoops = () => {
	let boops = Simon.currentBoops;
	boops.forEach(e => clearTimeout(e));
	boops = [];
	Simon.stopErrTone();
	Simon.stopGoodTone();
};

const togglePlay = () => {
	Simon.play = !Simon.play;
	if (Simon.play){
		intro();
		return;
	}
	cancelBoops();
	reset();
};

const toggleStrict = () => {
	Simon.strict = !Simon.strict;
};

const togglePower = () => {
	Simon.power = !Simon.power;
	if (Simon.power){
		Simon.reset();
		return;
	}
	cancelBoops();
	Simon.stopGoodTone();
	Simon.stopErrTone();
	Simon.display = null;
}

const checkSelection = (id) => {
	let index = Simon.index;
	let chain = Simon.chain;

	if (chain[index] === id){
		if (index === chain.length - 1){
			Simon.index = 0;
			Simon.lock = true;
			setTimeout(generateMove, 1000);
			return;
		}
		Simon.index++;
		return;
	}
	if (Simon.strict) {
		notifyWrong(id);
		setTimeout(() => {
			Simon.lock = true;
			Simon.selected = -1;
			Simon.chain = [];
			Simon.index = 0;
		}, 2000)
		return;
	}
	notifyWrong(id);
	let timers = Simon.currentBoops;
	let timer = setTimeout(() => {
		Simon.lock = true;
		Simon.selected = -1;
		Simon.index = 0;
		displayChain();
	}, 2000);
};

const notifyWrong = (id) => {
	Simon.stopGoodTone();
	Simon.playErrTone();
	setTimeout(stopErrTone, 1500);
};

initializeAudio = (audioContext) => {
	const frequencies = [329.63, 261.63, 220, 164.81];

	let errOsc = audioContext.createOscillator();
	errOsc.type = 'triangle';
	errOsc.frequency.value = 110;
	errOsc.start(0.0);

	let errNode = audioContext.createGain();
	errOsc.connect(errNode);
	errNode.gain.value = 0;
	errNode.connect(audioContext.destination);

	const ramp = 0.05;
	const vol = 0.5;

	const oscillators = frequencies.map((frq) => {
		let osc = audioContext.createOscillator();
		osc.type = 'sine';
		osc.frequency.value = frq;
		osc.start(0.0);
		return osc;
	});

	const gainNodes = oscillators.map((osc) => {
		let g = audioContext.createGain();
		osc.connect(g);
		g.connect(audioContext.destination);
		g.gain.value = 0;
		return g;
	});

	Simon.playGoodTone = (id) => {
		gainNodes[id].gain.linearRampToValueAtTime(vol, audioContext.currentTime + ramp);
	};

	Simon.stopGoodTone = (id) => {
		if (id) {
			gainNodes[id].gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
			return;
		}
		gainNodes.forEach((g) => {
			g.gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
		});
	};

	Simon.playErrTone = () => {
		errNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + ramp);
	};

	Simon.stopErrTone = () => {
		errNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
	};
};

let ready = () => {
	let AudioContext = AudioContext || webkitAudioContext;
	if (!AudioContext){
		console.log('AudioContext missing. Use a better browser.');
		return;
	}
	const audioContext = new AudioContext();
	
	initializeAudio(audioContext);

	init();

	let playBtn = document.getElementById('play-btn');
	let strictBtn = document.getElementById('strict-btn');
	let powerBtn = document.getElementById('power-btn');

	let s0 = document.getElementById('section-0');
	let s1 = document.getElementById('section-1');
	let s2 = document.getElementById('section-2');
	let s3 = document.getElementById('section-3');


};

if (document.readyState != 'loading'){
	ready();
} else {
	document.addEventListener('DOMContentLoaded', ready);
}