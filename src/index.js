const COLORS = ['darkred', 'midnightblue', 'green', 'goldenrod'];
const SELECTED_COLORS = ['red', 'mediumblue', 'lime', 'yellow'];

let PRESS_LENGTH;
const PRESS_INTERVAL = 250;

const Simon = {};
let sections;
let buttons = {};
let first, second;

const init = () => {
	Simon.power = false;
	Simon.chain = [];
	Simon.index = 0;
	Simon.play = false;
	Simon.strict = false;
	Simon.lock = false;
	Simon.selected = -1;
	Simon.timers = [];
};

const reset = () => {
	Simon.play = false;
	Simon.index = 0;
	Simon.chain = [];
	Simon.lock = true;
	Simon.timers = [];
	Simon.selected = -1;
	PRESS_LENGTH = 850;
};

const intro = () => {
	generateMove();
};

const generateMove = () => {
	let move = Math.floor(Math.random() * 4);
	Simon.chain.push(move);
	if (Simon.chain.length + 1 % 4 === 0 && PRESS_LENGTH > 400){
		PRESS_LENGTH -= 150;
	}

	updateDisplay();
	Simon.index = 0;
	displayChain();
};

const displayChain = () => {
	let timers = Simon.timers.slice();
	let timer = setTimeout(boop, 1000);
	timers.push(timer);
	Simon.currentBoops = timers;
};

const updateDisplay = () => {
	if (!Simon.power) {
		first.innerText = '';
		second.innerText = '';
		return;
	}
	
	let msg = String(Simon.chain.length);
	if (msg.length < 2) {
		msg = '0' + msg;
	}
	first.innerText = msg[0];
	second.innerText = msg[1];
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
	resetDisplay();
};

const resetDisplay = () => {
	first.innerText = '';
	second.innerText = '';
};

const togglePlay = () => {
	if (!Simon.power) return;
	Simon.play = !Simon.play;
	if (Simon.play){
		intro();
		buttons['play'].classList.add('on');
		buttons['play'].classList.remove('off');
		updateDisplay();
		return;
	}

	cancelBoops();
	reset();
	resetDisplay();
	intro();
};

const toggleStrict = () => {
	if (Simon.power){
		Simon.strict = !Simon.strict;
		if (Simon.strict) {
			buttons['strict'].classList.add('on');
			buttons['strict'].classList.remove('off');
			return;
		}
		buttons['strict'].classList.add('off');
		buttons['strict'].classList.remove('on');
	}
};

const togglePower = () => {
	Simon.power = !Simon.power;
	if (Simon.power){
		reset();
		buttons['power'].classList.add('on');
		buttons['power'].classList.remove('off');
		first.innerText = '-';
		second.innerText = '-';
		return;
	}
	for (let prop in buttons){
			buttons[prop].classList.remove('on');
			buttons[prop].classList.add('off');
		}
	cancelBoops();
	resetDisplay();
}

const checkSelection = () => {
	let id = Number(Simon.selected);
	let index = Simon.index;
	let chain = Simon.chain;

	if (chain[index] === id){
		if (index === chain.length - 1){
			Simon.index = 0;
			Simon.lock = true;
			setTimeout(generateMove, 2000);
			return true;
		}
		Simon.index++;
		return true;
	}
	Simon.lock = true;
	if (Simon.strict) {
		notifyWrong(id);
		setTimeout(() => {
			Simon.selected = -1;
			Simon.chain = [];
			Simon.index = 0;
			generateMove();
		}, 2000)
		return  false;
	}
	notifyWrong(id);
	let timers = Simon.currentBoops;
	let timer = setTimeout(() => {
		Simon.selected = -1;
		Simon.index = 0;
		displayChain();
	}, 2000);
	return false;
};

const notifyWrong = (id) => {
	first.innerText = '!';
	second.innerText = '!';
	Simon.stopGoodTone();
	Simon.playErrTone();
	setTimeout(() => {
		Simon.stopErrTone();
		updateDisplay();
	}, 2000);
};

const initializeAudio = (audioContext) => {
	// audio black magic shamelessly stolen from the example
	// on freecodecamp.
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
		sections[id].classList.add('selected');
		gainNodes[id].gain.linearRampToValueAtTime(vol, audioContext.currentTime);
	};

	Simon.stopGoodTone = (id) => {
		if (id) {
			sections[id].classList.remove('selected');
			gainNodes[id].gain.linearRampToValueAtTime(0, audioContext.currentTime);
			return;
		}
		gainNodes.forEach((g, i) => {
			sections[i].classList.remove('selected');
			g.gain.linearRampToValueAtTime(0, audioContext.currentTime);
		});
	};

	Simon.playErrTone = () => {
		errNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + ramp);
	};

	Simon.stopErrTone = () => {
		errNode.gain.linearRampToValueAtTime(0, audioContext.currentTime);
	};
};

const sectionMouseDown = (id) => {
	Simon.selected = id;
	Simon.playGoodTone(id);
	document.addEventListener('touchup', sectionMouseUp, {once: true});
	document.addEventListener('mouseup', sectionMouseUp, {once: true});
};

const sectionMouseUp = () => {
	Simon.stopGoodTone();
	checkSelection();
};

const ready = () => {
	var AC = AudioContext || webkitAudioContext;
	if (!AC){
		console.log('AudioContext missing. Use a better browser.');
		return;
	}
	var audioContext = new AC();
	
	initializeAudio(audioContext);

	init();

	buttons['play'] = document.getElementById('play-btn');
	buttons['strict'] = document.getElementById('strict-btn');
	buttons['power'] = document.getElementById('power-btn');
	
	sections = {
		'0': document.getElementById('section-0'),
		'1': document.getElementById('section-1'),
		'2': document.getElementById('section-2'),
		'3': document.getElementById('section-3')
	};

	for (let i = 0; i < 4; i++){
		let fn = () => {
			if (Simon.lock || !Simon.power) return;
			sectionMouseDown(i);
		}
		sections[i].addEventListener('mousedown', fn);
		sections[i].addEventListener('touchstart', fn);
	}

	buttons['play'].addEventListener('click', togglePlay);
	buttons['strict'].addEventListener('click', toggleStrict);
	buttons['power'].addEventListener('click', togglePower);

	first = document.getElementById('first');
	second = document.getElementById('second');
};


document.addEventListener('DOMContentLoaded', ready);