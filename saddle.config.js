

process.env.NODE_TLS_REJECT_UNAUTHORIZED=0

module.exports = {
  // solc: "solc",                                          // Solc command to run
  solc_args: [                                              // Extra solc args
    '--allow-paths','contracts,tests/Contracts',
    '--evm-version', 'istanbul'
  ],
  solc_shell_args: {                                        // Args passed to `exec`, see:
    maxBuffer: 1024 * 500000,                               // https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
    shell: process.env['SADDLE_SHELL'] || '/bin/bash'
  },
  // build_dir: ".build",                                   // Directory to place built contracts
  extra_build_files: ['remote/*.json'],                     // Additional build files to deep merge
  // coverage_dir: "coverage",                              // Directory to place coverage files
  // coverage_ignore: [],                                   // List of files to ignore for coverage
  contracts: process.env['SADDLE_CONTRACTS'] || "{contracts,contracts/**,tests/Contracts}/*.sol",
                                                            // Glob to match contract files
  trace: false,                                             // Compile with debug artifacts
  // TODO: Separate contracts for test?
  tests: ['**/tests/{,**/}*Test.js'],                       // Glob to match test files
  networks: {                                               // Define configuration for each network
    development: {
      providers: [
        {env: "PROVIDER"},
        {http: "https://ethrpc1:8545"}
      ],
      web3: {                                               // Web3 options for immediate confirmation in development mode
        gas: [
          {env: "GAS"},
          {default: "6700000"}
        ],
        gas_price: [
          {env: "GAS_PRICE"},
          {default: "20000"}
        ],
        options: {
          transactionConfirmationBlocks: 1,
          transactionBlockTimeout: 5
        }
      },
      accounts: [                                           // How to load default account for transactions
        {env: "ACCOUNT"},                                   // Load from `ACCOUNT` env variable (e.g. env ACCOUNT=0x...)
        {unlocked: 0}                                       // Else, try to grab first "unlocked" account from provider
      ]
    },
    test: {
      providers: [

        {env: "PROVIDER"},
        {http: "https://ethrpc1:8545"}
      ],
      web3: {
        gas: [
          {env: "GAS"},
          {default: "20000000"}
        ],
        gas_price: [
          {env: "GAS_PRICE"},
          {default: "12000000002"}
        ],
        options: {
          transactionConfirmationBlocks: 1,
          transactionBlockTimeout: 5
        }
      },
      accounts: [
        {env: "ACCOUNT"},
        {unlocked: 0}
      ]
    },
    goerli: {
      providers: [
        {env: "PROVIDER"},
        {file: "~/.ethereum/goerli-url"},                    // Load from given file with contents as the URL (e.g. https://infura.io/api-key)
        {http: "https://goerli-eth.compound.finance"}
      ],
      web3: {
        gas: [
          {env: "GAS"},
          {default: "6700000"}
        ],
        gas_price: [
          {env: "GAS_PRICE"},
          {default: "12000000000"}
        ],
        options: {
          transactionConfirmationBlocks: 1,
          transactionBlockTimeout: 5
        }
      },
      accounts: [
        {env: "ACCOUNT"},
        {file: "~/.ethereum/goerli"},                         // Load from given file with contents as the private key (e.g. 0x...)
        {unlocked: 0}
      ]
    },
    ropsten: {
      providers: [
        {env: "PROVIDER"},
        {file: "~/.ethereum/ropsten-url"},                    // Load from given file with contents as the URL (e.g. https://infura.io/api-key)
      ],
      web3: {
        gas: [
          {env: "GAS"},
          {default: "6700000"}
        ],
        gas_price: [
          {env: "GAS_PRICE"},
          {default: "12000000000"}
        ],
        options: {
          transactionConfirmationBlocks: 1,
          transactionBlockTimeout: 5
        }
      },
      accounts: [
        {env: "ACCOUNT"},
        {file: "~/.ethereum/ropsten"}                         // Load from given file with contents as the private key (e.g. 0x...)
      ]
    },
    rinkeby: {
      providers: [
        {env: "PROVIDER"},
        {file: "~/.ethereum/rinkeby-url"},                    // Load from given file with contents as the URL (e.g. https://infura.io/api-key)
        {http: "https://rinkeby-eth.compound.finance"}
      ],
      web3: {
        gas: [
          {env: "GAS"},
          {default: "4600000"}
        ],
        gas_price: [
          {env: "GAS_PRICE"},
          {default: "12000000000"}
        ],
        options: {
          transactionConfirmationBlocks: 1,
          transactionBlockTimeout: 5
        }
      },
      accounts: [
        {env: "ACCOUNT"},
        {file: "~/.ethereum/rinkeby"},                        // Load from given file with contents as the private key (e.g. 0x...)
        {unlocked: 0}
      ]
    },
  },
  get_network_file: (network) => {
    return null;
  },
  read_network_file: (network) => {
    const fs = require('fs');
    const path = require('path');
    const util = require('util');

    const networkFile = path.join(process.cwd(), 'networks', `${network}.json`);
    return util.promisify(fs.readFile)(networkFile).then((json) => {
      return JSON.parse(json)['Contracts'] || {};
    });
  },
  write_network_file: (network, value) => {
    const fs = require('fs');
    const path = require('path');
    const util = require('util');

    const networkFile = path.join(process.cwd(), 'networks', `${network}.json`);
    return util.promisify(fs.readFile)(networkFile).then((json) => {
      return util.promisify(fs.writeFile)(networkFile,
      JSON.stringify({
        ...JSON.parse(json),
        'Contracts': value
      }, null, 4));
    });
  }
}
