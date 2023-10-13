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
  #result;

  /**
   * Creates a new Lotto instance.
   * 
   * @param {object} config The configuration object.
   * @param {string} config.handle The name of the lottery.
   * @param {boolean} config.debug Whether or not to log debug messages.
   * @param {number} config.expires The number of days until the cookie expires.
   * @param {string} config.cookieDomain The domain to set the cookie on. Defaults to the root domain.
   * @param {array} config.odds The odds of winning the lottery. Defaults to [50, 100] (aka. 50%).
   * @param {function} config.onLoss The callback to run when the lottery is lost.
   * @param {function} config.onWin The callback to run when the lottery is won.
   * @returns {Lotto} The Lotto instance.
   */
  constructor(config = {}) {
  
    const defaults = {
      handle: null,
      debug: false,
      expires: 7,
      cookieDomain: null,
      odds: [50, 100], 
      onLoss: null,
      onWin: null
    };

    this.#config = Object.assign(this.#config, defaults, config);

    if (!this.#config.handle)
      throw new Error('Lotto.js - A lottery handle must be provided.');

    this.#config.handle = this.constructor.toSnakeCase(this.#config.handle);
    
    return this;
  
  }

  /**
   * Manually sets the odds of the lottery.
   * 
   * @param {number} chances The number of chances to win.
   * @param {number} outOf The total number of chances.
   * @returns {Lotto} The Lotto instance.
   */
  odds(chances, outOf) {
  	
    this.#config.odds = [chances, outOf];
		
    return this;
    
  }

  /**
   * Decides whether or not the lottery was won.
   * 
   * @returns {boolean} Whether or not the lottery was won.
   */
  choose() {
  
  	if (!this.#shouldChoose())
    	this.#forceResult();
  	
    if (this.#config.debug)
    	console.log(`Chosing ${this.#config.handle} lottery 🎲 @ ${this.#config.odds.join(' / ')} odds...`);
    
    return this.#determineResult();
    
  }

  /**
   * Returns the result of the lottery without choosing.
   * 
   * @returns {boolean} Whether or not the lottery was won.
   * @throws {Error} If the lottery has not been chosen yet.
   */
  winner() {
    
    if (this.#result === undefined)
      throw new Error(`The ${this.#config.handle} lottery has not been chosen yet.`);

    return this.#result;

  }

  /**
   * Returns the result of the lottery stored in its cookie.
   * 
   * @param {string} handle The name of the lottery.
   * @returns {boolean} Whether or not the lottery was won.
   */
  static isWinner(handle) {
    return Lotto.getCookie(handle) === 'true';
  }

  /**
   * Converts a string to snake_case.
   * 
   * @param {string} str The string to convert.
   * @returns {string} The converted string.
   */ 
  static toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Returns the name of the lottery's cookie.
   * 
   * @param {string} handle The name of the lottery.
   * @returns {string} The name of the cookie.
   */ 
  static getCookieName(handle) {
    return `__lotto_${Lotto.toSnakeCase(handle)}`;
  } 

  /**
   * Returns the value of the lottery's cookie.
   * 
   * @param {string} handle The name of the lottery.
   * @returns {string} The value of the cookie.
   */
  static getCookie(handle) {

    name = `${this.getCookieName(handle)}=`;
    
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
  
  /**
   * Sets the value of the lottery's cookie.
   * 
   * @param {boolean} the result of the lottery.
   * @returns {void}
   */
  #setCookie(value) {
    
    const date = new Date();
    
    date.setTime(date.getTime() + (this.#config.expires * 24 * 60 * 60 * 1000));
    
    let expires = `expires=${date.toUTCString()}`;
    
    const domain = this.#config.cookieDomain ?? this.#extractRootDomain();

    document.cookie = `${this.constructor.getCookieName(this.#config.handle)}=${value};${expires};${domain};path=/`;
  
  }
  
  /**
   * Extracts the highest level domain from the hostname.
   * 
   * @param {string} hostname The hostname to extract the domain from. Defaults to window.location.hostname.
   * @returns {string} The extracted domain.
   */
  #extractRootDomain(hostname = location.hostname) {
  
    const parts = hostname.split('.');
  
    const slds = [
      'co.uk', 
      'co.jp',
      'co.nz',
      'co.za',
      'com.au',
      'net.au',
    ];
  
    if (parts.length === 1) {
      return parts[0];
    } else if (slds.includes(parts.slice(-2).join('.'))) {
      return parts.slice(-3).join('.');
    }
  
    return parts.slice(-2).join('.');
  
  }
  
  /**
   * Returns a random integer between 0 and max.
   * 
   * @param {number} max The maximum number to return.
   * @returns {number} The random integer.
   */
  #getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  
  /**
   * Determines the result of the lottery.
   * 
   * @returns {boolean} Whether or not the lottery was won.
   */
  #determineResult() {
  
  	const randomInt = this.#getRandomInt(100);
    const percent = Math.floor((this.#config.odds[0] / this.#config.odds[1]) * 100);
  	const result = randomInt < percent;
    
    this.#setCookie(result);
    this.#runCallback(result);
    
  	return result;
  
  }
  
  /**
   * Forces the result of the lottery.
   * 
   * @returns {void}
   */
  #forceResult() {

    const result = this.constructor.getCookie(this.#config.handle);
  
  	if (this.#config.debug)
    	console.log(`Forcing result (${result}) of ${this.#config.handle} lottery.`);
    
    this.#runCallback(result);
    
  }
  
	/**
   * Runs the onWin/onLoss config callback.
   * 
   * @param {boolean} result The result of the lottery.
   * @returns {void}
   */
	#runCallback(result) {
  
  	const callback = result ? 'onWin' : 'onLoss';
  
    if (typeof this.#config[callback] === 'function')
      this.#config[callback](this.#config.handle);
      
  }
  
  /**
   * Checks if lottery cookie exists. 
   * 
   * @returns {boolean} Whether or not the lottery cookie exists.
   */
  #shouldChoose() {
  	return this.constructor.getCookie(this.#config.handle) === '';
  }

}