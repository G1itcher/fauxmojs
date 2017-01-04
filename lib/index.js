'use strict';

/*
    This module implements SSDP udp discovery services.
 */
const udpServer   = require('dgram').createSocket('udp4'),
      Hapi        = require('hapi'),
      hapiServer  = new Hapi.Server(),
      debug       = require('debug')('ssdp-server'),
      _           = require('lodash'),
      async       = require('async'),
      IpHelper    = require('ip');

class FauxMo {
  constructor(options) {
    this.bootId = 1;
    this.ipAddress = options.ipAddress || IpHelper.address();

    debug('using ip address:', this.ipAddress);

    if (!options.devices) {
      throw new Error('At least one device must be configured.');
    }

    this.init(options.devices);
  }

  init(deviceOptions) {
    this.devices = {};
    this.deviceTypes = [];
    let tempTypeDict = {};

    deviceOptions.reduce((prev, device) => {
      let deviceId = device.uid;
      if(!tempTypeDict[device.constructor])
      {
        tempTypeDict[device.constructor] = true;
        this.deviceTypes.push(device.constructor);
      }
      prev[deviceId] = device;

      return prev;
    }, this.devices);

    this.startDiscoveryServer();
    this.startVirtualDeviceEndpoints();

    hapiServer.start((err) => {

      if (err) {
        throw err;
      }
      debug('Setup Server running.');
    });
  }

  startDiscoveryServer() {
    udpServer.on('error', (err) => {
      debug(`server error:\n${err.stack}`);
      udpServer.close();
    });

    udpServer.on('message', (msg, rinfo) => {
      debug(`<< server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

      if (msg.indexOf('ssdp:discover') > 0) {
        async.eachSeries(this.getDiscoveryResponses(), (response, cb) => {
          debug('sending device response.');
          udpServer.send(response, rinfo.port, rinfo.address, () => {
            debug('>> sent response ssdp discovery response');
            cb();
          });
        }, (err) => {
          debug('complete sending all responses. ', err ? `Received error: ${err}` : 'Success');
        });
      }
    });

    udpServer.on('listening', () => {
      var address = udpServer.address();
      debug(`server listening ${address.address}:${address.port}`);
      udpServer.addMembership('239.255.255.250');
    });

    debug('binding to port 1900 for ssdp discovery');
    udpServer.bind(1900);
  }

  startVirtualDeviceEndpoints() {
    _.forOwn(this.devices, (device, id) => {
      hapiServer.connection({port: device.port, labels: [id]});
    });

    for(let type of this.deviceTypes)
    {
      for(let route of type.buildRoutes(this.devices))
      {
        hapiServer.route(route);
      }
    }
  }

  getDiscoveryResponses() {
    let responses = [];

    _.forOwn(this.devices, (device, k) => {
      responses.push(Buffer.from(device.searchResponse))
    });
    return responses;
  }
}

module.exports = FauxMo;