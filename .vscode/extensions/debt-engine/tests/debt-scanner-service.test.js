/**
 * Unit tests for Debt Scanner Service
 */

const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const glob = require('glob');
const readline = require('readline');
const { EventEmitter } = require('events');
const DebtScannerService = require('../services/debt-scanner-service');

describe('DebtScannerService', () => {
  let service;
  let mockLogger;
  let mockGlob;
  let mockFs;
  let mockReadline;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub()
    };

    // Mock glob
    mockGlob = sinon.stub(glob, 'glob');

    // Mock fs
    mockFs = {
      existsSync: sinon.stub(fs, 'existsSync'),
      mkdirSync: sinon.stub(fs, 'mkdirSync'),
      writeFileSync: sinon.stub(fs, 'writeFileSync'),
      createReadStream: sinon.stub(fs, 'createReadStream')
    };

    // Mock readline
    mockReadline = sinon.stub(readline, 'createInterface');

    // Create service instance
    service = new DebtScannerService({
      markers: ['#test:'],
      includePatterns: ['**/*.js'],
      excludePatterns: ['**/node_modules/**']
    }, mockLogger);
  });

  afterEach(() => {
    // Restore stubs
    sinon.restore();
  });

  describe('_buildScanCommand', () => {
    it('should build a proper scan command', () => {
      const result = service._buildScanCommand('/workspace', '#test:');
      expect(result).to.include('powershell -Command');
      expect(result).to.include('#test:');
      expect(result).to.include('*.js');
    });
  });

  describe('_parseScanResult', () => {
    it('should parse a scan result line correctly', () => {
      const line = '/workspace/file.js:10:// #test: This is a test';
      const result = service._parseScanResult(line, '#test:', '/workspace');

      expect(result).to.deep.equal({
        filePath: '/workspace/file.js',
        lineNum: '10',
        description: 'This is a test',
        relPath: 'file.js'
      });
    });

    it('should return null for invalid lines', () => {
      const line = 'Invalid format';
      const result = service._parseScanResult(line, '#test:', '/workspace');
      expect(result).to.be.null;
    });
  });

  describe('scanWorkspace', () => {
    it('should handle errors gracefully', async () => {
      // Mock an error
      mockExec.callsFake((cmd, callback) => {
        callback(new Error('Command failed'), null, null);
      });

      // Call the method
      await service.scanWorkspace('/workspace');

      // Check that error was logged
      expect(mockLogger.error.called).to.be.true;
    });
  });
});
