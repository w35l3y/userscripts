/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  global.Breader = Breader;

  var mHaveTypedArray = global.Uint8Array !== void 0 ? true : false;


  /**
   * @constructor
   */
  function Breader(pBuffer) {
    /**
     * The pointer to the current index of the buffer.
     * @type {Number}
     * @private
     */
    this.i = 0;

    /**
     * The current bit buffer.
     * @type {Number}
     * @private
     */
    this.bb = 0;

    /**
     * The current bit buffer length;
     * @type {Number}
     * @private
     */
    this.bbl = 0;

    /**
     * The buffer to read from.
     * @private
     */
    this.b;

    if (typeof pBuffer === 'string') {
      var tBuffer;
      var tLength = pBuffer.length;
      var i = 0;
      if (mHaveTypedArray) {
        tBuffer = this.b = new Uint8Array(tLength);
        for (; i < tLength; i++) {
          tBuffer[i] = pBuffer.charCodeAt(i) && 0xFF;
        }
      } else {
        tBuffer = this.b = new Array(tLength);
        for (; i < tLength; i++) {
          tBuffer[i] = pBuffer.charCodeAt(i) && 0xFF;
        }
      }
    } else if (pBuffer.__proto__ === Array.prototype) {
      if (mHaveTypedArray) {
        this.b = new Uint8Array(pBuffer);
      } else {
        this.b = pBuffer;
      }
    } else {
      this.b = pBuffer; // Be forward looking. It's a Uint8Array.
    }
    /**
     * The size of the buffer.
     * Can be changed to simulate trimming.
     * @type {Number}
     */
    this.fileSize = pBuffer.length;
  }

  Breader.prototype = /** @lends {Breader#} */ {

    /**
     * Gets a subarray from the given index to the length;
     * @param {Number} pFrom The index to start from.
     * @param {Number} pLength The length from pFrom to end at.
     * @return {Array} The sub array.
     */
    sub: function(pFrom, pLength) {
      if (mHaveTypedArray) {
        return new Uint8Array(this.b.buffer, pFrom, pLength);
      } else {
        return this.b.slice(pFrom, pFrom + pLength);
      }
    },

    /**
     * Align the current bits to the nearest large byte.
     */
    a: function() {
      if (this.bbl !== 0) {
        this.bb = 0;
        this.bbl = 0;
      }
    },

    /**
     * Seeks the given offset in the buffer.
     * @param {Number} pOffset The offset to seek.
     */
    seek: function(pOffset) {
      this.a();
      if (this.i + pOffset > this.fileSize) {
        throw new Error('Index out of bounds');
      }
      this.i += pOffset;
    },

    /**
     * Seeks to the given index in the buffer.
     * @param {Number} pIndex The index to seek to.
     */
    seekTo: function(pIndex) {
      this.a();
      if (pIndex > this.fileSize) {
        throw new Error('Index out of bounds');
      }
      this.i = pIndex;
    },

    /**
     * Gets the current position of the index in the buffer.
     * @return {Number} The index.
     */
    tell: function() {
      return this.i;
    },

    /**
     * Peeks a bits, not modifying the state of this Breader.
     * @param {Number} pNumber The number of bits to peek at.
     * @return {Number} The bits.
     */
    peekBits: function(pNumber) {
      var tBuffer = this.b,
          tByteIndex = this.i,
          tBitBuffer = this.bb,
          tBitBufferLength = this.bbl;

      var tTmp = 0;

      while (tBitBufferLength < pNumber) {
        tTmp = tBuffer[tByteIndex++];
        if (tTmp === void 0) {
          throw new Error('Index out of bounds');
        }
        tBitBuffer = (tBitBuffer << 8) | tTmp;
        tBitBufferLength += 8;
      }

      tTmp = tBitBuffer >>> (tBitBufferLength - pNumber);

      return tTmp;
    },

    /**
     * Reads bits.
     * @param {Number} pNumber The number of bits to read.
     * @return {Number} The bits.
     */
    bp: function(pNumber) {
      var tBuffer = this.b,
          tByteIndex = this.i,
          tBitBuffer = this.bb,
          tBitBufferLength = this.bbl;

      var tTmp = 0;

      while (tBitBufferLength < pNumber) {
        tTmp = tBuffer[tByteIndex++];
        if (tTmp === void 0) {
          throw new Error('Index out of bounds');
        }
        tBitBuffer = (tBitBuffer << 8) | tTmp;
        tBitBufferLength += 8;
      }

      tTmp = tBitBuffer >>> (tBitBufferLength - pNumber);
      tBitBuffer &= (((1 << tBitBufferLength) - 1) & ((1 << (tBitBufferLength - pNumber)) - 1));
      //tBitBuffer <<= pNumber;
      tBitBufferLength -= pNumber;

      this.bb = tBitBuffer;
      this.bbl = tBitBufferLength;
      this.i = tByteIndex;

      return tTmp;
    },

    /**
     * Reads a fixed point from bits with a precision of 16.
     * @param {Number} pNumber The number of bits to read.
     * @return {Number} The fixed point.
     */
    fpb16p: function(pNumber) {
      return this.bsp(pNumber) * 0.0000152587890625;
    },

    /**
     * Reads a fixed point from bits with a precision of 8.
     * @param {Number} pNumber The number of bits to read.
     * @return {Number} The fixed point.
     */
    fpb8p: function(pNumber) {
      return this.bsp(pNumber) * 0.00390625;
    },

    /**
     * Reads a IEEE Float32 value.
     * @return {Number} The float.
     */
    F32: function() {
      // TODO: This is a major hack. Is it ok?
      var tIndex = this.i;
      if (tIndex + 4 > this.fileSize) {
        throw new Error('Index out of bounds.');
      }
      this.i += 4;
      // TODO: Support arrays.
      return (new DataView(this.b.buffer, this.b.byteOffset + tIndex, 4)).getFloat32(0, true);
    },

    /**
     * Reads a IEEE Float64 value.
     * @return {Number} The float.
     */
    F64: function() {
      // TODO: This is a major hack. Is it ok?
      var tIndex = this.i;
      if (tIndex + 8 > this.fileSize) {
        throw new Error('Index out of bounds.');
      }
      this.i += 8;
      // TODO: Support arrays.
      return (new DataView(this.b.buffer, this.b.byteOffset + tIndex, 8)).getFloat64(0, true);
    },

    /**
     * Reads a signed number from bits.
     * @param {Number} pNumber The number of bits to read.
     * @return {Number} The bits.
     */
    bsp: function(pNumber) {
      var tResult = this.bp(pNumber);
      if (tResult >> (pNumber - 1)) {
        tResult -= 1 << pNumber;
      }
      return tResult;
    },

    /**
     * Reads one byte.
     * @return {Number} The byte.
     */
    B: function() {
      var tResult = this.b[this.i];
      if (tResult === void 0) {
        throw new Error('Index out of bounds.');
      }
      this.i++
      return tResult;
    },

    /**
     * Reads a two byte unsigned integer.
     * @return {Number} The number.
     */
    I16: function() {
      var tBuffer = this.b,
          tIndex = this.i;
      if (tIndex + 2 > this.fileSize) {
        throw new Error('Index out of bounds.');
      }
      var tResult = (tBuffer[tIndex]) | (tBuffer[tIndex + 1] << 8);
      this.i += 2;
      return tResult;
    },

    /**
     * Reads a 4 byte unsigned integer.
     * @return {Number} The number.
     */
    I32: function() {
      /**
       * @type {Uint8Array}
       */
      var tBuffer = this.b;

      /**
       * @type {Number}
       */
      var tIndex = this.i;

      if (tIndex + 4 > this.fileSize) {
        throw new Error('Index out of bounds.');
      }

      /**
       * @type {Number}
       */
      var tResult =
        ((tBuffer[tIndex + 3] << 24) >>> 0) |
        (tBuffer[tIndex + 2] << 16) |
        (tBuffer[tIndex + 1] << 8) |
        tBuffer[tIndex];
      this.i += 4;
      return tResult;
    },

    /**
     * Reads a 2 byte signed integer.
     * @return {number} The number.
     */
    SI16: function() {
      var tResult = this.I16();
      if (tResult >> 1) {
        tResult -= 1 << 1;
      }
      return tResult;
    },

    /**
     * Reads a 4 byte signed integer.
     * @return {Number} The number.
     */
    SI32: function() {
      /**
       * @type {Uint8Array}
       */
      var tBuffer = this.b;

      /**
       * @type {Number}
       */
      var tIndex = this.i;

      if (tIndex + 4 > this.fileSize) {
        throw new Error('Index out of bounds.');
      }

      /**
       * @type {Number}
       */
      var tResult =
        (tBuffer[tIndex + 3] << 24) |
        (tBuffer[tIndex + 2] << 16) |
        (tBuffer[tIndex + 1] << 8) |
        tBuffer[tIndex];
      this.i += 4;
      return tResult;
    },

    /**
     * Reads a single character.
     * @return {String} The character.
     */
    c: function() {
      var tResult = this.b[this.i];
      if (tResult === void 0) {
        throw new Error('Index out of bounds.');
      }
      this.i++;
      return String.fromCharCode(tResult);
    },

    /**
     * Reads a string until a null character is found.
     * @return {String} The string.
     */
    s: function() {
      var tString = '';
      var tBuffer = this.b;
      var i = this.i;
      var tChar = 0;
      for (; ; i++) {
        tChar = tBuffer[i];
        if (tChar === 0) {
          i++;
          break;
        } else if (tChar === void 0) {
          throw new Error('Index out of bounds.');
        }
        tString += String.fromCharCode(tChar);
      }
      this.i = i;
      return tString;
    },

    /**
     * Reads a string in ascii encoding.
     * @param {Number} pLength The length of the string to read.
     * @return {String} The string.
     */
    sp: function(pLength) {
      var tString = '';
      var tBuffer = this.b;
      var i = this.i;
      pLength += i;
      if (pLength > this.fileSize) {
        throw new Error('Index out of bounds.');
      }
      for (; i < pLength; i++) {
        tString += String.fromCharCode(tBuffer[i]);
      }
      this.i = i;
      return tString;
    }

  };

}(this));
