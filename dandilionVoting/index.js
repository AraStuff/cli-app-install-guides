const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const ora = require('ora');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,tokenManager,token,voting,quorum,support,time,environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);
const url = chalk.green


// new apps
const newVotingAppId = '0x9fa3927f639745e587912d4b0fea7ef9013bf93fb907d29faeab57417ba6e1d4';
const newVotingBase = (environment === 'rinkeby') 
    ? '0xb4fa71b3352D48AA93D34d085f87bb4aF0cE6Ab5'
    : '0xb935C3D80229d5D92f3761b17Cd81dC2610e3a45'
let newVoting;


// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const newVotingInitSignature = 'initialize(address,uint64,uint64,uint64)'; 


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
    newVoting = await calculateNewProxyAddress(dao, nonce1);
  

    // app initialisation payloads
    const newVotingInitPayload = await encodeActCall(newVotingInitSignature, [
        token,
        support,
        quorum,
        time
    ])


    // package first tx1
    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            newVotingAppId,
            newVotingBase,
            newVotingInitPayload,
            false,
        ]),
        encodeActCall(createPermissionSignature, [
            tokenManager,
            newVoting,
            keccak256('CREATE_VOTES_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            newVoting,
            keccak256('MODIFY_SUPPORT_ROLE'),
            voting,
        ]),
        encodeActCall(createPermissionSignature, [
            voting,
            newVoting,
            keccak256('MODIFY_QUORUM_ROLE'),
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
    ];

    const script = encodeCallScript(actions);

    await execAppMethod(
        dao,
        voting,
        'newVote',
        [
            script,
            `
            installing newVoting
            `,
        ],
        () => {},
        environment,
    );
}


const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('newVoting'),
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