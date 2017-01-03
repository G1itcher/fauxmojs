'use strict';

const Server = require('../lib/index-Y');
const FauxMo = require('../lib/devices/FauxMo');
const FauxHue = require('../lib/devices/FauxHue');

let server = new Server(
  {
    devices: [
      new FauxMo("test light", 11002, (action) => {
          console.log('test light action:', action);
        }
      ),
      new FauxMo("test fan", 11003, (action) => {
          console.log('test fan action:', action);
        }
      )
      /*
      {
        name: 'test light',
        port: 11002,
        handler: (action) => {
          console.log('office light action:', action);
        }
      }
*/
    ]
  });

console.log('started..');