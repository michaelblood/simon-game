const {render} = require('react-dom');
const React = require('react');
/* TODO: 
 * 
 * add proper 'wrong' sound?
 * add proper 'wrong' alert
 * clean up ui
 * add reset button 
 * add "win" condition
 * 
 */

class Middle extends React.Component {
	constructor(props){
		super(props);
		

	}
	
	render(){
		let content = this.props.content,
				first = null,
				second = null;
		if (content){
			content = content.toString();
			if (content.length < 2){
				content = '0' + content;
			}
			first = content[0];
			second = content[1];
		}
		return (
			<div className="middle">
				<button
					id="play-btn"
					className={this.props.playClass}
					onClick={this.props.play}
					>Play
				</button>
				<button
					id="strict-btn"
					className={this.props.strictClass}
					onClick={this.props.strict}
					>Strict
				</button>
				
				<div
					id="lcd"
					className="lcd"
					>
					<span
						className="digit">
						{first}
					</span>
					<span
						className="digit">
						{second}
					</span>
				</div>
			</div>
		);
	}
}

class Section extends React.Component {
	constructor(props){
		super(props);
		
		this.state = {
			lastSound: null
		}; // for stopping sound on power off
		
		this.play.bind(this);
		this.stop.bind(this);
	}
	
	play(){
		this.stop();
		if (this.props.sound){
			this.props.sound.play();
		}
	}
	
	stop(){
		if (this.props.sound){
			this.props.sound.pause();
			this.props.sound.currentTime = 0;
		} else {
			if (this.state.lastSound){
				this.state.lastSound.pause();
			}
		}
	}
	
	render(){
		let sectionId = 'section-' + this.props.id;
		let cName = "section";
		if (this.props.selected){
			cName += " selected";
			this.play();
		} else {
			this.stop();
		}
		return (
			<div
				className={cName}
				onMouseDown={(e) => this.props.onMouseDown(e)}
				onTouchStart={(e) => this.props.onMouseDown(e)}
				id={sectionId}
				wrong={this.props.wrong}
				role="button"
			>{sectionId}
			</div>
		);
	}
	
}

class Game extends React.Component {
	constructor(){
		super();
		
		let SOUNDS = [];

		SOUNDS[0] = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound1.mp3");
		SOUNDS[1] = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound2.mp3");
		SOUNDS[2] = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound3.mp3");
		SOUNDS[3] = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound4.mp3");
		
		this.state = {
			chain: [],
			index: 0,
			play: false,
			strict: false,
			lock: true,
			selected: null,
			playClass: 'btn off',
			strictClass: 'btn off',
			interval: 500,
			boopLength: 1000,
			currentBoops: [],
			display: null,
			sounds: SOUNDS
		};
		
		this.toggleStrict.bind(this);
		this.togglePlay.bind(this);
		
		this.generateMove.bind(this);
		this.displayChain.bind(this);
		this.boop.bind(this);
		this.cancelBoops.bind(this);
		this.checkSelection.bind(this);
		this.wrong.bind(this);
		
		this.renderSections.bind(this);
		this.sectionMouseDown.bind(this);
	}
	
	generateMove(){
		let move = Math.floor(Math.random() * 4);
		let chain = this.state.chain.slice();
		chain.push(move);
		
		this.setState({
			chain: chain,
			index: 0
		}, () => this.displayChain());
	}
	
	displayChain(){
		/************
		    CHEAT
		 ************
		let chain = this.state.chain.slice(0);
		
		let message = '';
		for (let i = 0; i < chain.length; i++){
			message += ' ' + chain[i];
		}
		console.log(message);
		*/
		let timers = this.state.currentBoops.slice(0);
		let timer = window.setTimeout(() => this.boop(0), 1000);
		timers.push(timer);
		this.setState({
			currentBoops: timers,
			display: this.state.chain.length
		});
	}
	
	// make boop sound
	boop(i){
		let index = this.state.chain.length;
		
		if (i === index){
			window.setTimeout(() => this.setState({
				lock: false
			}), this.state.boopLength + this.state.interval);
			
			return;
		}
		this.setState({
			selected: this.state.chain[i]
		}, () => {
			let tmp = window.setTimeout(() => this.boop(i+1), this.state.boopLength + this.state.interval);
			let tmp2 = window.setTimeout(() => this.setState({selected: null}), this.state.boopLength);
			let timers = this.state.currentBoops.slice(0);
			timers.push(tmp);
			this.setState({
				currentBoops: timers
			});
		});
	}
	
	cancelBoops(){
		let boops = this.state.currentBoops.slice();
		boops.forEach((e) => window.clearTimeout(e));
		this.setState({
			currentBoops: []
		});
	}
	
	togglePlay(){
		let play = !this.state.play;
		let cName = 'btn ';
		cName += play ? 'on' : 'off';
		this.setState({
			play: play,
			playClass: cName
		}, () => {
			if (this.state.play){
				this.generateMove();
			} else {
				this.cancelBoops();
				this.setState({
					chain: [],
					index: 0,
					display: null
				});
			}
		});
	}
	
	toggleStrict(){
		let strict = !this.state.strict;
		let cName = 'btn ';
		cName += strict ? 'on' : 'off';
		this.setState({
			strict: strict,
			strictClass: cName
		});
	
	}
	
	checkSelection(i){
		let index = this.state.index;
		let chain = this.state.chain;

		let correct = chain[index] === i;
		
		if (correct){
			if (index === chain.length-1){
				this.setState({
					index: 0,
					lock: true
				});
				window.setTimeout(() => this.generateMove(), 1500);
			} else {
				this.setState({
					index: index+1
				});
			}
		} else {
			if (this.state.strict){
				// YOU LOSE. GOOD DAY SIR.
				this.wrong(i);
				// feedback for error
				
				window.setTimeout(() => this.setState({
					lock: true,
					selected: null,
					chain: [],
					index: 0
				}, () => this.generateMove()), 3000);
				
				
				
				
			} else {
				// feedback for error
				this.wrong(i);
				let timers = this.state.currentBoops.slice(0);
				let timer = window.setTimeout(() => this.setState({
					lock: true,
					selected: null,
					index: 0
				},() => this.displayChain()), 2000);
				
				timers.push(timer);
				this.setState({
					currentBoops: timers
				});
			}
		}

	}
	
	wrong(i){
		this.setState({
			wrong: true
		}, () => window.setTimeout(() => this.setState({
			wrong: false
		}), 2000));
		//play wrong sound
		let sounds = this.state.sounds;
		
		sounds.forEach((s) => s.currentTime = 0);
		
		sounds[0].play();
		window.setTimeout(() => {
			sounds[0].pause();
			sounds[1].play();
			window.setTimeout(() => {
				sounds[1].pause();
				sounds[2].play();
				window.setTimeout(() => {
					sounds[2].pause();
					sounds[3].play();
					window.setTimeout(() => sounds[3].pause(), 250);
				}, 250);
			}, 250);
		}, 250);
	}
	
	
	renderSections(){
		let sections = [];
		for (let i = 0; i < 4; i++){
			let section = (
				<Section
					onMouseDown={(e) => this.sectionMouseDown(e, i)}
					onTouchStart={(e) => this.sectionMouseDown(e, i)}
					id={i}
					wrong={this.state.wrong}
					key={i}
					sound={this.state.sounds[i]}
					selected={(this.state.selected === i)}
				></Section>
			);
			sections.push(section);
		}
		return sections;
	}
	
	sectionMouseDown(e, i){
		if (this.state.lock){
			return;
		}
		this.setState({
			selected: i
		});
		
		this.checkSelection(i);
		
		document.addEventListener('touchend', this.sectionMouseUp.bind(this));
		document.addEventListener('mouseup', this.sectionMouseUp.bind(this));
		e.preventDefault();
		e.stopPropagation();
	}
	
	sectionMouseUp(e){
		let id = e.target.id;
		id = parseInt(id.slice(id.length-1));
		
		this.setState({
			selected: null
		});
		
		document.removeEventListener('touchend', this.sectionMouseUp)
		document.removeEventListener('mouseup', this.sectionMouseUp);
	}
	

	render(){
		let sections = this.renderSections();

		return (
			<div className="container">
				<div className="circle">
					{sections}
				</div>
				<Middle
					content={this.state.display}
					play={() => this.togglePlay()}
					strict={() => this.toggleStrict()}
					playClass={this.state.playClass}
					strictClass={this.state.strictClass}
					/>
			</div>
		);
	}
}

render(<Game />, document.getElementById('game'));

