/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var Breader = global.Breader;

  global.AtoJ = {
    compileActionScript2: compileActionScript2
  };

  function indent(pDepth) {
    return (new Array(pDepth + 1)).join('  ');
  }

  /**
   * A map of AST types to functions that output JavaScript code.
   * @type {Object}
   */
  var mASTExpressionConverters = {
    'raw': function(pData, pIndent) {
      return pData.value;
    },

    'declare': function(pData, pIndent) {
      return  'var ' +
              pData.name +
              (
                pData.value !== void 0 ?
                ' = ' + mASTExpressionConverters[pData.value.type](pData.value, pIndent) :
                ''
              ) +
              ';';
    },

    'assign': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' = ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent) +
              ';'; // TODO: This could have illegal cases.
    },

    'literal': function(pData, pIndent) {
      return mASTLiteralConverters[pData.what](pData, pIndent);
    },

    'comment': function(pData, pIndent) {
      return '/*' + pData.value + '*/';
    },

    'call': function(pData, pIndent) {
      var tResult = mASTExpressionConverters[pData.value.type](pData.value, pIndent) + '(';

      if (pData.args !== void 0) {
        var tArgs = pData.args;
        for (var i = 0, il = tArgs.length; i < il; i++) {
          tResult += mASTExpressionConverters[tArgs[i].type](tArgs[i], pIndent);
          if (i !== il - 1) {
            tResult += ', ';
          }
        }
      }

      return tResult + ')';
    },

    'add': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' + ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'subtract': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' - ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'multiply': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' * ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'divide': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' / ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'equals': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' === ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'roughly_equals': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' == ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'less': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' < ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'and': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' && ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'or': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              ' || ' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent);
    },

    'not': function(pData, pIndent) {
      return  '!(' + mASTExpressionConverters[pData.value.type](pData.value, pIndent) + ')';
    },

    'branch': function(pData, pIndent) {
      var tResult =
        pData.what + ' (!(' +
        mASTExpressionConverters[pData.condition.type](pData.condition, pIndent) +
        ')) {\n';

      var tBody = pData.body;
      var tBodyLength = tBody.length;
      pIndent++;

      for (var i = 0; i < tBodyLength; i++) {
        var tBodyI = tBody[i];
        tResult += indent(pIndent) + mASTExpressionConverters[tBodyI.type](tBodyI, pIndent);
        if (
            tBodyI.type !== 'branch' &&
            tBodyI.type !== 'else'
          ) {
          tResult += ';';
        }
        tResult += '\n';
      }

      return tResult + indent(pIndent - 1) + '}'; // make else and else if pretty?
    },

    'else': function(pData, pIndent) {
      var tResult = 'else {\n';
      var tBody = pData.body;
      var tBodyLength = tBody.length;
      pIndent++;

      for (var i = 0; i < tBodyLength; i++) {
        var tBodyI = tBody[i];
        tResult += indent(pIndent) + mASTExpressionConverters[tBodyI.type](tBodyI, pIndent);
        if (
            tBodyI.type !== 'branch' &&
            tBodyI.type !== 'else'
          ) {
          tResult += ';';
        }
        tResult += '\n';
      }

      return tResult + indent(pIndent - 1) + '}';
    }

  };

  var mASTLiteralConverters = {
    'function': function(pData, pIndent) {
      var tBody = pData.body;
      var tBodyLength = tBody.length;
      var tCode = new Array(tBodyLength);
      pIndent++;

      for (var i = 0; i < tBodyLength; i++) {
        var tBodyI = tBody[i];
        var tCodeI = indent(pIndent) + mASTExpressionConverters[tBodyI.type](tBodyI, pIndent);
        if (
            tBodyI.type !== 'branch' &&
            tBodyI.type !== 'else'
          ) {
          tCodeI += ';';
        }
        tCode[i] = tCodeI;
      }

      return  indent(pIndent - 1) +
        'function' +
        (pData.name !== void 0 ? ' ' + pData.name : '') +
        '() {\n' +
        tCode.join('\n') +
        '\n' +
        indent(pIndent - 1) +
        '}';
    },

    'reference': function(pData, pIndent) {
      return pData.value;
    },

    'property': function(pData, pIndent) {
      return  mASTExpressionConverters[pData.left.type](pData.left, pIndent) +
              '[' +
              mASTExpressionConverters[pData.right.type](pData.right, pIndent) +
              ']';
    },

    'this': function(pData, pIndent) {
      return 'this';
    },

    'object': function(pData, pIndent) {
      var tResult = '{';

      var tIsFirst = true;
      var tData = pData.value;
      for (var k in tData) {
        if (tIsFirst) {
          tIsFirst = false;
        } else {
          tResult += ', ';
        }
        tResult += '\'' + k + '\': ' + mASTExpressionConverters[tData[k].type](tData[k], pIndent);
      }

      return tResult + '}';
    },

    'array': function(pData, pIndent) {
      var tResult = '[';

      var tIsFirst = true;
      var tData = pData.value;
      for (var i = 0, il = tData.length; i < il; i++) {
        if (tIsFirst) {
          tIsFirst = false;
        } else {
          tResult += ', ';
        }
        tResult += mASTExpressionConverters[tData[i].type](tData[i], pIndent);
      }

      return tResult + ']';
    },

    'string': function(pData, pIndent) {
      // TODO: Make sure the string is valid.
      var tValue = pData.value;
      tValue = tValue
                .replace(/\n/g, '\\n')
                .replace(/'/g, '\\\'');
      return '\'' + tValue + '\'';
    },

    'number': function(pData, pIndent) {
      // TODO: Make sure the number is valid.
      return pData.value;
    },

    'boolean': function(pData, pIndent) {
      return pData.value;
    }
  };

  /**
   * Compiles JavaScript to a function.
   * @param pAST
   * @param pFunctionMap
   */
  function compile(pCode) {
    return eval('(' + pCode + ')');
  }

  /**
   * Decompiles AST to a JavaScript string.
   * @param {Object|Array.<Object>} pAST The AST as single object or an array.
   * @param {Object.<string, Function>} pFunctionMap A map of functions for implementation.
   */
  function toJavaScript(pAST, pFunctionMap) {
    var tCode;
    if (pAST.__proto__ === Array.prototype) {
      tCode = new Array(pAST.length);
      for (var i = 0, il = pAST.length; i < il; i++) {
        tCode[i] = mASTExpressionConverters[pAST[i].type](pAST[i], 0);
      }
      console.log(tCode.join('\n'));
    } else {
      tCode = [mASTExpressionConverters[pAST.type](pAST, 0)];
    }
    return tCode.join('\n');
  }

  /**
   * Converts ActionScript byte-code to JavaScript.
   * @param {Uint8Array} pData The byte-code.
   * @param {Object.<string, Function>} pFunctionMap A map of action codes that require implementation to functions.
   * @param {number} pVersion The SWF file version.
   * @return {Function} The compiled code.
   */
  function compileActionScript2(pData, pFunctionMap, pVersion) {
    var tReader = new Breader(pData);
    var tSize = tReader.fileSize;

    var tAST = [
      {
        type: 'literal',
        what: 'function',
        body: [
          {
            type: 'declare',
            name: 'tTarget',
            value: {
              type: 'literal',
              what: 'this'
            }
          }
        ]
      }
    ];

    function getBooleanLiteral(pResult) {
      if (pVersion <= 4) {
        return {
          type: 'literal',
          what: 'number',
          value: pResult ? 1 : 0
        };
      } else {
        return {
          type: 'literal',
          what: 'boolean',
          value: pResult ? true : false
        };
      }
    }

    function toNumber(pAST, pType) {
      return {
        type: 'or',
        left: {
          type: 'call',
          value: {
            type: 'literal',
            what: 'reference',
            value: 'parse' + pType
          },
          args: [
            pAST,
            {
              type: 'literal',
              what: 'number',
              value: 10
            }
          ]
        },
        right: {
          type: 'literal',
          what: 'number',
          value: 0
        }
      };
    }

    function toFloat(pAST) {
      return toNumber(pAST, 'Float');
    };

    function toInt(pAST) {
      return toNumber(pAST, 'Int');
    };

    function toString(pAST) {
      return {
        type: 'or',
        left: pAST,
        right: {
          type: 'literal',
          what: 'string',
          value: ''
        }
      };
    }

    function toFunction(pWhich, pArguments) {
      var tOrig = pFunctionMap[pWhich];

      if (tOrig === void 0) {
        return {
          type: 'comment',
          value: 'Unknown function in function map: ' + pWhich
        };
      }

      var tNew = {};

      function recurseObject(pOrig, pNew) {
        for (var k in pOrig) {
          if (pOrig[k].__proto__ === Array.prototype) {
            pNew[k] = new Array(pOrig[k].length);
            recurseArray(pOrig[k], pNew[k]);
          } else if (typeof pOrig[k] === 'object') {
            pNew[k] = {};
            recurseObject(pOrig[k], pNew[k]);
          } else {
            pNew[k] = pOrig[k];
          }
        }
      }

      function recurseArray(pOrig, pNew) {
        for (var i = 0, il = pOrig.length; i < il; i++) {
          if (pOrig[i].__proto__ === Array.prototype) {
            pNew[i] = new Array(pOrig[i].length);
            recurseArray(pOrig[i], pNew[i]);
          } else if (typeof pOrig[i] === 'object') {
            pNew[i] = {};
            recurseObject(pOrig[i], pNew[i]);
          } else {
            pNew[i] = pOrig[i];
          }
        }
      }

      recurseObject(tOrig, tNew);

      if (tNew.type === 'call') {
        if (!pArguments) {
          pArguments = {};
        }

        pArguments.currentTarget = {
          type: 'literal',
          what: 'reference',
          value: 'tTarget'
        };

        tNew.args = [
          {
            type: 'literal',
            what: 'object',
            value: pArguments
          }
        ];
      }

      return tNew;
    }

    var tPreviousAST = null;
    var tParentAST = tAST[0];
    var tASTPointer = tAST[0].body;
    var tASTPointerStack = [];

    function add(pAST) {
      pAST.parent = tParentAST;
      tPreviousAST !== null && (tPreviousAST.next = pAST);
      pAST.previous = tPreviousAST;
      tPreviousAST = pAST;
      tASTPointer.push(pAST);
    }

    function enter(pAST) {
      tPreviousAST = null;
      tASTPointerStack.push(tParentAST);
      tParentAST = pAST;
      tASTPointer = pAST.body;
    }

    function leave() {
      tParentAST = tASTPointerStack.pop();
      tASTPointer = tParentAST.body;
      tPreviousAST = tASTPointer[tASTPointer.length - 1] || null;
    }

    var tStartPointer = tReader.tell();
    var tByteToASTMap = new Array(tSize);
    var tByteToASTMapIndicies = [];
    var tCurrentAST;
    var tByteOffset = 0;
    var tIfTarget = -1;
    var tIfTargetStack = [];
    var tJumpCodeOffsets = [];
    var tJumpTargets = [];

    var tFrameIndex = 0;
    var tString = '';
    var tTemp = null;
    var tTempInt = 0;
    var tTempStack = [];
    var tTempStackIndex = -1;
    var tTempStackByteOffsets = [];

    mainloop: while ((tByteOffset = tReader.tell()) <= tSize) {
      var tActionCode = tReader.B();
      var tActionLength = 0;

      if (tActionCode > 127) {
        tActionLength = tReader.I16();
      }

      tCurrentAST = void 0;

      if (tByteOffset - tStartPointer === tIfTarget) {
        tIfTarget = tIfTargetStack.pop();
        leave();
      }

      switch (tActionCode) {
        case 0x00: // End
          tCurrentAST = tASTPointer[tASTPointer.length - 1];
          for (var i = 0, il = tTempStackByteOffsets.length; i < il; i++) {
            tTempInt = tTempStackByteOffsets[i];
            tByteToASTMap[tTempInt] = {
              ast: tCurrentAST,
              index: tByteToASTMapIndicies.push(tTempInt) - 1
            };
          }
          tTempStackByteOffsets.length = 0;

          tByteToASTMap[tByteOffset] = {
            ast: tCurrentAST,
            index: tByteToASTMapIndicies.push(tByteOffset) - 1
          };
          break mainloop;
        case 0x04: // NextFrame
          tCurrentAST = toFunction('nextFrame');
          break;
        case 0x05: // PreviousFrame
          tCurrentAST = toFunction('previousFrame');
          break;
        case 0x06: // Play
          tCurrentAST = toFunction('play');
          break;
        case 0x07: // Stop
          tCurrentAST = toFunction('stop');
          break;
        case 0x08: // ToggleQuality
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented ToggleQuality here!'
          };
          break;
        case 0x09: // StopSounds
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented StopSounds here!'
          };
          break;
        case 0x0A: // Add
          tTempStack[tTempStackIndex - 1] = {
            type: 'add',
            left: toFloat(tTempStack[tTempStackIndex--]),
            right: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x0B: // Subtract
          tTempStack[tTempStackIndex - 1] = {
            type: 'subtract',
            right: toFloat(tTempStack[tTempStackIndex--]),
            left: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x0C: // Multiply
          tTempStack[tTempStackIndex - 1] = {
            type: 'multiply',
            left: toFloat(tTempStack[tTempStackIndex--]),
            right: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x0D: // Divide
          tTempStack[tTempStackIndex - 1] = {
            type: 'divide',
            right: toFloat(tTempStack[tTempStackIndex--]),
            left: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x0E: // Equals
          tTempStack[tTempStackIndex - 1] = {
            type: 'equals',
            left: toFloat(tTempStack[tTempStackIndex--]),
            right: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x0F: // Less
          tTempStack[tTempStackIndex - 1] = {
            type: 'less',
            right: toFloat(tTempStack[tTempStackIndex--]),
            left: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x10: // And
          tTempStack[tTempStackIndex - 1] = {
            type: 'and',
            left: toFloat(tTempStack[tTempStackIndex--]),
            right: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x11: // Or
          tTempStack[tTempStackIndex - 1] = {
            type: 'or',
            left: toFloat(tTempStack[tTempStackIndex--]),
            right: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x12: // Not
          tTempStack[tTempStackIndex] = {
            type: 'not',
            value: toFloat(tTempStack[tTempStackIndex])
          };
          break;
        case 0x13: // StringEquals
          tTempStack[tTempStackIndex - 1] = {
            type: 'equals',
            left: toString(tTempStack[tTempStackIndex--]),
            right: toString(tTempStack[tTempStackIndex])
          };
          break;
        case 0x17: // Pop
          tCurrentAST = tTempStack[tTempStackIndex--];
          break;
        case 0x18: // ToInteger
          tTempStack[tTempStackIndex] = {
            type: 'call',
            value: {
              type: 'raw',
              value: 'Math.floor'
            },
            args: [
              tTempStack[tTempStackIndex]
            ]
          };
          break;
        case 0x1C: // GetVariable
          tTempStack[tTempStackIndex] = toFunction('getVariable', {
            name: tTempStack[tTempStackIndex]
          });
          break;
        case 0x1D: // SetVariable
          tCurrentAST = toFunction('setVariable', {
            value: tTempStack[tTempStackIndex--],
            name: tTempStack[tTempStackIndex--]
          });
          break;
        case 0x21: // StringAdd
          tTempStack[tTempStackIndex - 1] = {
            type: 'add',
            right: toString(tTempStack[tTempStackIndex--]),
            left: toString(tTempStack[tTempStackIndex])
          };
          break;
        case 0x22: // GetProperty
          tTempStack[tTempStackIndex - 1] = toFunction('getProperty', {
            property: toInt(tTempStack[tTempStackIndex--]),
            name: toString(tTempStack[tTempStackIndex])
          });
          break;
        case 0x23: // SetProperty
          tCurrentAST = toFunction('setProperty', {
            value: tTempStack[tTempStackIndex--],
            property: toInt(tTempStack[tTempStackIndex--]),
            name: toString(tTempStack[tTempStackIndex])
          });
          break;
        case 0x24: // CloneSprite
          tCurrentAST = toFunction('cloneSprite', {
            depth: toInt(tTempStack[tTempStackIndex--]),
            target: toString(tTempStack[tTempStackIndex--]),
            name: toString(tTempStack[tTempStackIndex--])
          });
          break;
        case 0x25: // RemoveSprite
          tCurrentAST = toFunction('removeSprite', {
            name: toString(tTempStack[tTempStackIndex--])
          });
          break;
        case 0x26: // Trace
          tCurrentAST = toFunction('trace', {
            message: tTempStack[tTempStackIndex--]
          });
          break;
        case 0x27: // StartDrag
          tTempStackIndex -= 4;
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented StartDrag here!'
          };
          break;
        case 0x28: // EndDrag
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented EndDrag here!'
          };
          break;
        case 0x29: // StringLess
          tTempStack[tTempStackIndex - 1] = {
            type: 'less',
            left: toString(tTempStack[tTempStackIndex--]),
            right: toString(tTempStack[tTempStackIndex])
          };
          break;
        case 0x2D: // FSCommand2
          console.warn('fscommand2');
          tTempInt = (parseInt(compile(toJavaScript(tTempStack[tTempStackIndex--])), 10) || 1) - 1; // number of args to pop off the stack... Hopefully this is always a literal.
          tTempStack[tTempStackIndex - tTempInt - 1] = toFunction('fscommand2', {
            name: tTempStack[tTempStackIndex--],
            args: {
              type: 'literal',
              what: 'array',
              value: tTempStack.slice(tTempStackIndex - tTempInt, tTempInt)
            }
          });
          tTempStackIndex -= tTempInt;
          break;
        case 0x30: // RandomNumber
          tTempStack[tTempStackIndex] = {
            type: 'raw',
            value: '((Math.random() * (' + toJavaScript(toFloat(tTempStack[tTempStackIndex])) + ' - 1)) + 0.5) | 0'
          };
          break;
        case 0x14: // StringLength
        case 0x31: // MBStringLength
          tTempStack[tTempStackIndex] = {
            type: 'literal',
            what: 'property',
            left: toString(tTempStack[tTempStackIndex]),
            right: {
              type: 'literal',
              what: 'string',
              value: 'length'
            }
          };
          break;
        case 0x32: // CharToAscii
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented CharToAscii here!'
          };
          break;
        case 0x33: // AsciiToChar
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented AsciiToChar here!'
          };
          break;
        case 0x34: // GetTime
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented GetTime here!'
          };
          break;
        case 0x15: // StringExtract
        case 0x35: // MBStringExtract
          tTemp = tTempStack[tTempStackIndex--]; // count
          tTempStack[tTempStackIndex - 1] = {
            type: 'call',
            args: [
              {
                type: 'subtract',
                left: toInt(tTempStack[tTempStackIndex--]), // index
                right: {
                  type: 'literal',
                  what: 'number',
                  value: 1
                }
              },
              tTemp // count
            ],
            value: {
              type: 'literal',
              what: 'property',
              left: toString(tTempStack[tTempStackIndex]),
              right: {
                type: 'literal',
                what: 'string',
                value: 'substr'
              }
            }
          };
          break;
        case 0x36: // MBCharToAscii
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented MBCharToAscii here!'
          };
          break;
        case 0x37: // MBAsciiToChar
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented MBAsciiToChar here!'
          };
          break;
        case 0x81: // GoToFrame
          tCurrentAST = toFunction('gotoFrame', {
            frame: {
              type: 'literal',
              what: 'number',
              value: tReader.I16()
            }
          });
          break;
        case 0x83: // GetURL
          tString = tReader.s(); // UrlString: The Target URL string
          tString = tReader.s(); // TargetString: The target string. _level0 and _level1 loads SWF files to special area.
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented GetURL here!'
          };
          break;
        case 0x8A: // WaitForFrame
          tFrameIndex = tReader.I16(); // The frame to wait for.
          tReader.B(); // SkipCount: The number of actions to skip if frame is not loaded.
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented WaitForFrame here!'
          };
          break;
        case 0x8B: // SetTarget
        case 0x20: // SetTarget2
          tCurrentAST = {
            type: 'assign',
            left: {
              type: 'literal',
              what: 'reference',
              value: 'tTarget'
            },
            right: toFunction('setTarget', {
              target: tActionCode === 0x8B ? {
                type: 'literal',
                what: 'string',
                value: tReader.s()
              } : toString(tTempStack[tTempStackIndex--])
            })
          };
          break;
        case 0x8C: // GoToLabel
          tCurrentAST = toFunction('gotoLabel', {
            frame: {
              type: 'literal',
              what: 'string',
              value: tReader.s()
            }
          });
          break;
        case 0x8D: // WaitForFrame2
          tTempInt = tReader.B(); // SkipCount: The number of actions to skip.
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented WaitForFrame2 here!'
          };
          break;
        case 0x96: // Push
          var tPushValue;
          var tPushWhat;
          // TODO: Is it possible to have multiple pushes in a single push command?? Until the end of the length
          switch (tReader.B()) {
            case 0: // String literal
              tPushValue = tReader.s();
              tPushWhat = 'string';
              break;
            case 1: // Floating Point literal
              tPushValue = tReader.F32();
              tPushWhat = 'number';
              break;
            case 4: // Register Number
              tPushValue = tReader.B();
              tPushWhat = 'number';
              break;
            case 5: // Boolean
              tPushValue = tReader.B() ? true : false;
              tPushWhat = 'boolean';
              break;
            case 6: // Double
              tPushValue = tReader.F64();
              tPushWhat = 'number';
              break;
            case 7: // Integer
              tPushValue = tReader.I32();
              tPushWhat = 'number';
              break;
            case 8: // Constant8: For constant pool index < 256
              tPushValue = tReader.B();
              tPushWhat = 'number';
              break;
            case 9: // Constant16: For constant pool index >= 256
              tPushValue = tReader.I16();
              tPushWhat = 'number';
              break;
          }
          tTempStack[++tTempStackIndex] = {
            type: 'literal',
            what: tPushWhat,
            value: tPushValue
          };
          break;
        case 0x99: // Jump
          tJumpCodeOffsets.push(tByteOffset);
          tJumpTargets.push(tReader.SI16());
          break;
        case 0x9A: // GetURL2
          tReader.bp(2); // SendVarsMethod (0 = none, 1 = GET, 2 = POST)
          tReader.bp(4); // Reserved
          tReader.bp(1); // LoadTargetFlag (0 = target is a browser window, 1 = target is a path to sprite)
          tReader.bp(1); // LoadVariablesFlag (0 = no variables to load, 1 = load variables)
          tReader.a();
          tCurrentAST = {
            type: 'comment',
            value: 'Unimplemented GetURL2 here!'
          };
          break;
        case 0x9D: // If
          /*
           * - on if, create if node.
           * -- Code is all ast up to jump offset.
           * - if code at jump offset is an if, make elseif node.
           * -- Repeat from if.
           * - otherwise if previous ast was +jump, add else node until offset.
           * - otherwise if previous ast was -jump, change node to while.
           * - if -jump and next ast is not the current if's offset, add continue.
           * - if +jump and next ast is not the current if's offset, add break.
           */
          tIfTargetStack.push(tIfTarget);
          tIfTarget = tByteOffset + tReader.SI16() + tActionLength + 3;

          tTemp = {
            type: 'branch',
            what: 'if',
            condition: tTempStack[tTempStackIndex--],
            body: []
          };

          add(tTemp);
          enter(tTemp);

          for (var i = 0, il = tTempStackByteOffsets.length; i < il; i++) {
            tTempInt = tTempStackByteOffsets[i];
            tByteToASTMap[tTempInt] = {
              ast: tTemp,
              index: tByteToASTMapIndicies.push(tTempInt) - 1
            };
          }
          tTempStackByteOffsets.length = 0;

          tByteToASTMap[tByteOffset] = {
            ast: tTemp,
            index: tByteToASTMapIndicies.push(tByteOffset) - 1
          };
          continue mainloop;
        case 0x9E: // Call
          tCurrentAST = toFunction('call', {
            frame: tTempStack[tTempStackIndex--]
          });
          break;
        case 0x9F: // GoToFrame2
          tReader.bp(6); // Reserved
          var tSceneBias = tReader.bp(1); // SceneBiasFlag
          tReader.bp(1); // Play flag (0 = goto and stop, 1 = goto and play)
          tReader.a();
          if (tSceneBias === 1) {
            tSceneBias = tReader.I16(); // SceneBias (Number to be added to frame determined by stack argument)
          }
          tCurrentAST = toFunction('gotoFrameOrLabel', {
            frame: tTempStack[tTempStackIndex--],
            bias: {
              type: 'literal',
              what: 'number',
              value: tSceneBias
            }
          });
          break;
        default:
          console.warn('Unknown action code ' + tActionCode);
          tCurrentAST = {
            type: 'comment',
            value: 'Unknown tag ' + tActionCode + ' here!'
          };
          break;
      }

      if (tCurrentAST !== void 0) {
        for (var i = 0, il = tTempStackByteOffsets.length; i < il; i++) {
          tTempInt = tTempStackByteOffsets[i];
          tByteToASTMap[tTempInt] = {
            ast: tCurrentAST,
            index: tByteToASTMapIndicies.push(tTempInt) - 1
          };
        }
        tTempStackByteOffsets.length = 0;

        tByteToASTMap[tByteOffset] = {
          ast: tCurrentAST,
          index: tByteToASTMapIndicies.push(tByteOffset) - 1
        };

        add(tCurrentAST);
      } else {
        tTempStackByteOffsets.push(tByteOffset);
      }
    }

    var tTempAST;
    var tTargetAST;
    var tTempBody;
    var tIndex1, tIndex2;

    // After parsing everything, we resolve all jumps.
    for (var i = tJumpCodeOffsets.length - 1; i >= 0; i--) {
      tByteOffset = tJumpCodeOffsets[i];
      var tASTObject = tByteToASTMap[tByteOffset];

      if (tASTObject === void 0) {
        console.error('AS Byte map is bad with offset ' + tByteOffset);
        continue;
      }

      tTempAST = tASTObject.ast;

      var tJumpOffset = tJumpTargets[i];
      var tFinalJumpTarget = tByteOffset + tJumpOffset + 5; // 5 because that is the guarunteed length of a jump instruction.

      // If code at a jump offset is an if, make it and else if.
      if (tTempAST.type === 'branch' && tTempAST.what === 'if' || tTempAST.what === 'else if') {
        if (tJumpOffset < 0) {
          tTempAST.what = 'while';
        } else {
          tTempAST.what = 'else if';
        }
        continue;
      }

      if (tJumpOffset > 0) {
        // This is an else statement.

        tTargetAST = tByteToASTMap[tByteToASTMapIndicies[tByteToASTMap[tFinalJumpTarget].index - 1]].ast;
        tTempBody = tTempAST.parent.body;
        tIndex1 = tTempBody.indexOf(tTempAST);
        tIndex2 = tTempBody.indexOf(tTargetAST);
        if (tIndex2 < 0) {
          console.error('Bad jump target for else.');
          continue;
        }

        tTempAST = {
          type: 'else'
        };

        tTempAST.body = tTempBody.splice(tIndex1, tIndex2 + 1 - tIndex1, tTempAST);
      } else {
        // The previous if was actually a while loop.
        tByteToASTMap[tFinalJumpTarget].ast.what = 'while';
      }
    }
    console.log(tAST);

    return toJavaScript(tAST);
  }

}(this));
