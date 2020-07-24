const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;


const { dao, acl, tokenManager, voting, environment, ANY_ADDRESS } = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);

const url = chalk.green


// new apps
const harbergerAppId = '0xe2998d9700224635282e9c2da41222441463aa25bcf3bb5252b716e3c6045f95';
const harbergerBase = (environment === 'rinkeby') 
    ? '0x2f0920E5A09F5bc05Fd5320E96E9F4912CD646d0'
    : '0x5729ea9eD77EDD74F6Af0f364B156f726Cdc3651'
let harberger;


// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const harbergerInitSignature = 'initialize(address)';


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
    harberger = await calculateNewProxyAddress(dao, nonce1);


    // app initialisation payloads
    const harbergerInitPayload = await encodeActCall(harbergerInitSignature, [tokenManager]);


    // package first tx1
    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            harbergerAppId,
            harbergerBase,
            harbergerInitPayload,
            true,
        ]),
        encodeActCall(createPermissionSignature, [
            ANY_ADDRESS,
            harberger,
            keccak256('PURCHASE_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            harberger,
            keccak256('MINT_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            harberger,
            keccak256('BURN_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            harberger,
            keccak256('MODIFY_ROLE'),
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
            installing harberger
            `,
        ],
        () => {},
        environment,
    );
}


const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('harberger'),
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