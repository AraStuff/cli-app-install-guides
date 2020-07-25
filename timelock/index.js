const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,voting,token,ANY_ADDRESS,delay,lock_ammount,spam_factor,environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);

const url = chalk.green


// new apps
const timelockAppId = '0xfa94e850d73f1ae02876509afa1d8a303352a42378b81d085dd888ae0883fedd';
const timelockBase = (environment === 'rinkeby') 
    ? '0x49703aB04FFc95Ab3bC083D6e658552c7FbDA4d1'
    : '0x06A8CF8f54F04094a266a49f4886C578dc42b548'
let timelock;


// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const timelockInitSignature = 'initialize(address,uint256,uint256,uint256)'; 


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
    timelock = await calculateNewProxyAddress(dao, nonce1);
  

    // app initialisation payloads
    const timelockInitPayload = await encodeActCall(timelockInitSignature, [
        token,
        delay,
        lock_ammount,
        spam_factor
    ])


    // package first tx1
    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            timelockAppId,
            timelockBase,
            timelockInitPayload,
            true,
        ]),
        encodeActCall(createPermissionSignature, [
            ANY_ADDRESS,
            timelock,
            keccak256('LOCK_TOKENS_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            timelock,
            keccak256('CHANGE_DURATION_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            timelock,
            keccak256('CHANGE_AMOUNT_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            timelock,
            keccak256('CHANGE_SPAM_PENALTY_ROLE'),
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
            installing timelock
            `,
        ],
        () => {},
        environment,
    );
}


const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('timelock'),
            task: () => tx1()
        }
    ])
    await tasks.run()
        .then(() =>{
            console.log(`\n--------------------------------------------------------------------------------------------------------------------------`)
            console.log('Vote at ' + url(`http://${environment}.aragon.org/#/${dao}/${voting}`))
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