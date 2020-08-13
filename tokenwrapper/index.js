const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,deposit_token,voting,token_name,symbol, environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);

const url = chalk.green


// new apps
const tokenwrapperAppId = '0xdab7adb04b01d9a3f85331236b5ce8f5fdc5eecb1eebefb6129bc7ace10de7bd';
const tokenwrapperBase = (environment === 'rinkeby')
    ? '0xdeFe956e2FC6c6FF6c688B9c4092457fccce13cc'
    : '0x96E672A399b0E78F1B05631857F3D25c78Fabaf3'
let tokenwrapper;


// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const tokenwrapperInitSignature = 'initialize(address,string,string)';


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
    tokenwrapper = await calculateNewProxyAddress(dao, nonce1);


    // app initialisation payloads
    const tokenwrapperInitPayload = await encodeActCall(tokenwrapperInitSignature, [
        deposit_token,
        token_name,
        symbol
    ])


    // package first tx1
    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            tokenwrapperAppId,
            tokenwrapperBase,
            tokenwrapperInitPayload,
            true,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            tokenwrapper,
            keccak256('0x0000000000000000000000000000000000000000'),
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
            installing tokenwrapper
            `,
        ],
        () => {},
        environment,
    );
}


const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('tokenwrapper'),
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