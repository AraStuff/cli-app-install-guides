const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,voting,environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);
const url = chalk.green


// new apps
const addressbookAppId = '0x32ec8cc9f3136797e0ae30e7bf3740905b0417b81ff6d4a74f6100f9037425de';
const addressbookBase = (environment === 'rinkeby') 
    ? '0xFA69971092cbeF7eAc0e7B7eD4e4c1416010ccA0'
    : '0x14B1D2F2Fe09E88245c4F6Bd4F21269d0C63b98f'
let addressbook;


// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const addressbookInitSignature = 'initialize()'; 


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
    addressbook = await calculateNewProxyAddress(dao, nonce1);
  

    // app initialisation payloads
    const addressbookInitPayload = await encodeActCall(addressbookInitSignature, [])


    // package first tx1
    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            addressbookAppId,
            addressbookBase,
            addressbookInitPayload,
            true,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            addressbook,
            keccak256('ADD_ENTRY_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            addressbook,
            keccak256('REMOVE_ENTRY_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            addressbook,
            keccak256('UPDATE_ENTRY_ROLE'),
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
            installing addressbook
            `,
        ],
        () => {},
        environment,
    );
}


const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('addressbook'),
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