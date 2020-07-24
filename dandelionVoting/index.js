const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,tokenManager,token,voting,quorum,support,time,buffer,delay,environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);
const url = chalk.green


// new apps
const dandelionVotingAppId = '0x2d7442e1c4cb7a7013aecc419f938bdfa55ad32d90002fb92ee5969e27b2bf07';
const dandelionVotingBase = (environment === 'rinkeby') 
    ? '0x865511DCA976E036AB5e559DCCD8d6396893Ab40'
    : '0x417c5ec1E30D37f1d3D54A974E2F384e640046E5'
let dandelionVoting;


// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const dandelionVotingInitSignature = 'initialize(address,uint64,uint64,uint64,uint64,uint64)'; 


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
    dandelionVoting = await calculateNewProxyAddress(dao, nonce1);
  

    // app initialisation payloads
    const dandelionVotingInitPayload = await encodeActCall(dandelionVotingInitSignature, [
        token,
        support,
        quorum,
        time,
        buffer,
        delay
    ])


    // package first tx1
    const calldatum = await Promise.all([
        encodeActCall(newAppInstanceSignature, [
            dandelionVotingAppId,
            dandelionVotingBase,
            dandelionVotingInitPayload,
            false,
        ]),
        encodeActCall(createPermissionSignature, [
            tokenManager,
            dandelionVoting,
            keccak256('CREATE_VOTES_ROLE'),
            dandelionVoting,
        ]),
        encodeActCall(createPermissionSignature, [
            dandelionVoting,
            dandelionVoting,
            keccak256('MODIFY_SUPPORT_ROLE'),
            dandelionVoting,
        ]),
        encodeActCall(createPermissionSignature, [
            dandelionVoting,
            dandelionVoting,
            keccak256('MODIFY_QUORUM_ROLE'),
            dandelionVoting,
        ]),
        encodeActCall(createPermissionSignature, [
            dandelionVoting,
            dandelionVoting,
            keccak256('MODIFY_BUFFER_BLOCKS_ROLE'),
            dandelionVoting,
        ]),
        encodeActCall(createPermissionSignature, [
            dandelionVoting,
            dandelionVoting,
            keccak256('MODIFY_EXECUTION_DELAY_ROLE'),
            dandelionVoting,
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
            installing dandelionVoting
            `,
        ],
        () => {},
        environment,
    );
}


const main = async () => {

    const tasks = new Listr([
        {
            title: chalk.cyan('Installing ') + chalk.cyan.bold('dandelionVoting'),
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