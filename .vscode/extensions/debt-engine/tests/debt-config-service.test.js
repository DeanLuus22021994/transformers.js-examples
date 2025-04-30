/**
 * Unit tests for Debt Config Service
 */

const path = require('path');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const yaml = require('yaml');
const DebtConfigService = require('../services/debt-config-service');

describe('DebtConfigService', () => {
  let service;
  let mockLogger;
  let mockFs;
  
  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub()
    };
    
    // Mock fs
    mockFs = sinon.stub(fs, 'existsSync');
    sinon.stub(fs, 'readFileSync');
    
    // Create service instance
    service = new DebtConfigService(mockLogger);
  });
  
  afterEach(() => {
    // Restore stubs
    sinon.restore();
  });
  
  describe('loadConfig', () => {
    it('should load config from a valid file', async () => {
      // Setup mocks
      const mockConfig = {
        markers: [{ marker: '#test:' }],
        include_patterns: ['*.js'],
        exclude_patterns: ['node_modules']
      };
      
      mockFs.returns(true);
      fs.readFileSync.returns(yaml.stringify(mockConfig));
      
      // Call the method
      const config = await service.loadConfig('/workspace');
      
      // Check the result
      expect(config).to.deep.equal(mockConfig);
      expect(service.configLoaded).to.be.true;
      expect(mockLogger.info.called).to.be.true;
    });
    
    it('should create default config if no file found', async () => {
      // Setup mocks
      mockFs.returns(false);
      
      // Call the method
      const config = await service.loadConfig('/workspace');
      
      // Check the result
      expect(config).to.exist;
      expect(config.markers).to.exist;
      expect(service.configLoaded).to.be.true;
      expect(mockLogger.info.called).to.be.true;
    });
    
    it('should handle errors gracefully', async () => {
      // Setup mocks
      mockFs.returns(true);
      fs.readFileSync.throws(new Error('File read error'));
      
      // Call the method
      const config = await service.loadConfig('/workspace');
      
      // Check the result
      expect(config).to.exist; // Should return default config
      expect(mockLogger.error.called).to.be.true;
    });
  });
  
  describe('getMarkers', () => {
    it('should throw if config not loaded', () => {
      expect(() => service.getMarkers()).to.throw('Configuration not loaded');
    });
    
    it('should return config markers if available', async () => {
      // Setup
      service.config = { markers: [{ marker: '#test:' }] };
      service.configLoaded = true;
      
      // Check result
      expect(service.getMarkers()).to.deep.equal(['#test:']);
    });
    
    it('should return default markers if none in config', async () => {
      // Setup
      service.config = {};
      service.configLoaded = true;
      
      // Check result
      const markers = service.getMarkers();
      expect(markers).to.include('#debt:');
      expect(markers).to.include('#todo:');
    });
  });
});
