/* eslint-disable no-underscore-dangle, prefer-rest-params */

// eslint-disable-next-line
const isArray = Array.isArray;

class EventEmitter {
  emit(type) {
    // If there is no 'error' event listener then throw.
    if (type === 'error') {
      if (!this._events || !this._events.error ||
          (isArray(this._events.error) && !this._events.error.length)) {
        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
      }
    }

    if (!this._events) return false;
    const handler = this._events[type];
    if (!handler) return false;

    if (typeof handler === 'function') {
      switch (arguments.length) {
        // fast cases
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        // slower
        default:
          handler.apply(this, Array.prototype.slice.call(arguments, 1));
      }
      return true;
    } else if (isArray(handler)) {
      const args = Array.prototype.slice.call(arguments, 1);

      const listeners = handler.slice();
      for (let i = 0, l = listeners.length; i < l; i += 1) {
        listeners[i].apply(this, args);
      }
      return true;
    }

    return false;
  }

  addListener(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('addListener only takes instances of Function');
    }

    if (!this._events) this._events = {};

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    } else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);
    } else {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }

    return this;
  }

  on(type, listener) {
    return this.addListener(type, listener);
  }

  once(type, listener) {
    const g = () => {
      this.removeListener(type, g);
      listener.apply(this, arguments);
    };

    this.on(type, g);
  }

  removeListener(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    // does not use listeners(), so no side effect of creating _events[type]
    if (!this._events || !this._events[type]) return this;

    const list = this._events[type];

    if (isArray(list)) {
      const i = list.indexOf(listener);
      if (i < 0) return this;
      list.splice(i, 1);
      if (list.length === 0) {
        delete this._events[type];
      }
    } else if (this._events[type] === listener) {
      delete this._events[type];
    }

    return this;
  }

  off(type, listener) {
    return this.removeListener(type, listener);
  }

  removeAllListeners(type) {
    // does not use listeners(), so no side effect of creating _events[type]
    if (type && this._events && this._events[type]) this._events[type] = null;
    return this;
  }

  listenersfunction(type) {
    if (!this._events) this._events = {};
    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  }
}
