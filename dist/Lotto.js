/**!
 * Lotto.js
 * 
 * A Javascript utility class inspired by the Laravel Lottery facade.
 *
 * Author: Derek Cavaliero (@derekcavaliero)
 * Repository: https://github.com/derekcavaliero/lotto
 * Version: 1.0.beta
 * License: MIT
 */

class Lotto {

	#config = {};
  #cookieName;

  constructor(config = {}) {
  
    const defaults = {
      name: null,
      debug: false,
      expires: 7,
      odds: [50, 100], 
      onLoss: null,
      onWin: null
    };

    this.#config = Object.assign(this.#config, defaults, config);
    
    this.#cookieName = `lotto_${this.#config.name}`;
    
    return this;
  
  }
  
  #getCookie() {
    
    name = `${this.#cookieName}=`;
    
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    
    return '';
    
  }
  
  #setCookie(value) {
    
    const date = new Date();
    
    date.setTime(date.getTime() + (this.#config.expires * 24 * 60 * 60 * 1000));
    
    let expires = `expires=${date.toUTCString()}`;
    
    document.cookie = `${this.#cookieName}=${value};${expires};path=/`;
  
  }
  
  #extractRootDomain() {
  	
  }
  
  /**
   * Manually sets the odds
   */
  odds(chances, outOf) {
  	
    this.#config.odds = [chances, outOf];
		
    return this;
    
  }
  
  #getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  
  #determineResult() {
  
  	const randomInt = this.#getRandomInt(100);
    const percent = Math.floor((this.#config.odds[0] / this.#config.odds[1]) * 100);
  	const result = randomInt < percent;
    
    this.#setCookie(result);
    this.#runCallback(result);
    
  	return result;
  
  }
  
  #forceResult() {
  
  	if (this.#config.debug)
    	console.log(`Forcing result of ${this.#config.name} lottery - already determined from previous chance.`);
    
    this.#runCallback(this.#getCookie());
    
  }
  
	/**
   * Runs the onWin/onLoss config callback.
   */
	#runCallback(result) {
  
  	const callback = result ? 'onWin' : 'onLoss';
  
    if (typeof this.#config[callback] === 'function')
      this.#config[callback](this.#config.name);
      
  }
  
  /**
   * Checks if lottery cookie exists. 
   */
  #shouldChoose() {
  	return this.#getCookie() === '';
  }
  
  
  choose() {
  
  	if (!this.#shouldChoose())
    	this.#forceResult();
  	
    if (this.#config.debug)
    	console.log(`Chosing ${this.#config.name} lottery 🎲 @ ${this.#config.odds.join(' / ')} odds...`);
    
    return this.#determineResult();
    
  }

}