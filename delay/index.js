const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,voting,token_manager,delay_time,environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);

const url = chalk.green


// new apps
const delayAppId = '0x1c2b93ad1c4d4302f0169c8f596ce518e4a3324b1fed90c2d80a549a072bcd4e';
const delayBase = (environment === 'rinkeby') 
    ? '0x214044cc3fa7a3ECEF0bC9052Fe9B296585E3275'
    : '0x07759C39BbC1F88CA6b61B5EF500472Ca606DF89'
let delay;


// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const delayInitSignature = 'initialize(uint64)'; 


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
    delay = await calculateNewProxyAddress(dao, nonce1);
  

    // app initialisation payloads
    const delayInitPayload = await encodeActCall(delayInitSignature, [
        delay_time
    ])


    // package first tx1
    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            delayAppId,
            delayBase,
            delayInitPayload,
            true,
        ]),
        encodeActCall(createPermissionSignature, [
            token_manager,
            delay,
            keccak256('PAUSE_EXECUTION_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            delay,
            keccak256('SET_DELAY_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            delay,
            keccak256('DELAY_EXECUTION_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            delay,
            keccak256('RESUME_EXECUTION_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            delay,
            keccak256('CANCEL_EXECUTION_ROLE'),
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
        },
        {
            to: acl,
            calldata: calldatum[5],
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
            installing delay
            `,
        ],
        () => {},
        environment,
    );
}


const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('delay'),
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