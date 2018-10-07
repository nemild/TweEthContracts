const HDWalletProvider = require('truffle-hdwallet-provider');

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*'
      // gas: 8000029
    },
    kovan: {
      network_id: 42,
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC, "https://kovan.infura.io/v3/65255c1165ac49e99b98e13c03db917b", 1);
      }
    },
    mainnet: {
      network_id: 1,
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC, "https://mainnet.infura.io/v3/8d63da2adf584c59bc7d1a6877c503c9");
      }
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    }
  },
  mocha: {
    // reporter: 'eth-gas-reporter',
    // reporterOptions : {
    //   currency: 'USD',
    //   gasPrice: 10
    // }
  }
};