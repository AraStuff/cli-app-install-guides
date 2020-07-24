const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {dao,acl,token_manager,vault_or_agent,voting,ANY_ADDRESS, environment} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);

const url = chalk.green
const warning = chalk.bold.red;


// new apps
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
    const nonce2 = await buildNonceForAddress(dao, 1, provider);
    redemptions = await calculateNewProxyAddress(dao, nonce2);

    const redemptionsInitPayload = await encodeActCall(redemptionsInitSignature, [
        vault_or_agent,
        token_manager,
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
            token_manager,
            keccak256('BURN_ROLE'),
        ]),
        encodeActCall(grantPermissionSignature, [
            redemptions,
            vault_or_agent,
            keccak256('TRANSFER_ROLE'),
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
            title: chalk.cyan('Installing ') + chalk.cyan.bold('Redemptions'),
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