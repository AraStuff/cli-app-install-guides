const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const ora = require('ora');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,tokenManager,voting,ANY_ADDRESS, environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);

const url = chalk.green
const warning = chalk.bold.red;
const install = chalk.cyanBright;


// new apps
const agentAppId = '0x9ac98dc5f995bf0211ed589ef022719d1487e5cb2bab505676f0d084c07cf89a';
const agentBase = (environment === 'rinkeby') 
    ? '0xd3bbC93Dbc98128fAC514Be911e285102B931b5e'
    : '0x3A93C17FC82CC33420d1809dDA9Fb715cc89dd37'
let agent;

const redemptionsAppId = '0x743bd419d5c9061290b181b19e114f36e9cc9ddb42b4e54fc811edb22eb85e9d';
const redemptionsBase = (environment === 'rinkeby')
    ? '0xe47d2A5D3319E30D1078DB181966707d8a58dE98'
    : '0x5B1f69304651b3e7a9789D27e84f1F7336c356e8'
let redemptions;
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const grantPermissionSignature = 'grantPermission(address,address,bytes32)'; 
const redemptionsInitSignature = 'initialize(address,address,address[])'; 
const agentInitSignature = 'initialize()'; 


// functions for counterfactual addresses
async function buildNonceForAddress(_address, _index, _provider) {
    const txCount = await _provider.getTransactionCount(_address);
    return `0x${(txCount + _index).toString(16)}`;
}

async function calculateNewProxyAddress(_daoAddress, _nonce) {
    const rlpEncoded = RLP.encode([_daoAddress, _nonce]);
    const contractAddressLong = keccak256(rlpEncoded);
    const contractAddress = `0x${contractAddressLong.substr(-40)}`;

    return contractAddress;
}


async function tx1() {
    // counterfactual addresses
    const nonce1 = await buildNonceForAddress(dao, 0, provider);
    agent = await calculateNewProxyAddress(dao, nonce1);
  

    // app initialisation payloads
    const agentInitPayload = await encodeActCall(agentInitSignature, [])


    // package first tx1
    const calldatum = await Promise.all([
        // Agent Stuff
        encodeActCall(newAppInstanceSignature, [
            agentAppId,
            agentBase,
            agentInitPayload,
            true,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            agent,
            keccak256('TRANSFER_ROLE'),
            voting,
        ])
    ]);

    const actions = [
        {
            to: dao,
            calldata: calldatum[0],
        },
        {
            to: acl,
            calldata: calldatum[1],
        }
    ];

    const script = encodeCallScript(actions);

    await execAppMethod(
        dao,
        voting,
        'newVote',
        [
            script,
            `
            installing agent
            `,
        ],
        () => {},
        environment,
    );
}

async function tx2() {
    const nonce2 = await buildNonceForAddress(dao, 1, provider);
    redemptions = await calculateNewProxyAddress(dao, nonce2);

    const redemptionsInitPayload = await encodeActCall(redemptionsInitSignature, [
        agent,
        tokenManager,
        [ETH_ADDRESS]
    ]);

    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            redemptionsAppId,
            redemptionsBase,
            redemptionsInitPayload,
            true,
        ]),
        encodeActCall(createPermissionSignature, [
            ANY_ADDRESS,
            redemptions,
            keccak256('REDEEM_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            redemptions,
            keccak256('ADD_TOKEN_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            redemptions,
            keccak256('REMOVE_TOKEN_ROLE'),
            voting,
        ]),
        encodeActCall(grantPermissionSignature, [
            redemptions,
            tokenManager,
            keccak256('BURN_ROLE'),
        ])
    ])

    const actions = [
        {
            to: dao,
            calldata: calldatum[0],
        },
        {
            to: acl,
            calldata: calldatum[1],
        },
        {
            to: acl,
            calldata: calldatum[2],
        },
        {
            to: acl,
            calldata: calldatum[3],
        },
        {
            to: acl,
            calldata: calldatum[4],
        },
    ];

    const script = encodeCallScript(actions);

    await execAppMethod(
        dao,
        voting,
        'newVote',
        [
            script,
            `
            installing redemptions
            `,
        ],
        () => {},
        environment,
    );

}

const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('Agent'),
            task: () => tx1()
        },
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('Redemptions'),
            task: () => tx2()
        }
    ])
    await tasks.run()
        .then(() =>{
            console.log(`\n--------------------------------------------------------------------------------------------------------------------------`)
            console.log('Vote at ' + url(`http://${environment}.aragon.org/#/${dao}/${voting}`))
            console.log('You ' + warning('MUST WAIT ') + 'for the first transaction to pass before voting on the second')
            console.log('--------------------------------------------------------------------------------------------------------------------------')
        })
        .catch(err => {
            console.error(err);
        });
};

main()
    .then(() => {
        process.exit();
    })
    .catch((e) => {
        console.error(e);
        process.exit();
    });