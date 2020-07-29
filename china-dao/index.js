const {encodeCallScript} = require('@aragon/test-helpers/evmScript');
const {encodeActCall, execAppMethod} = require('mathew-aragon-toolkit');
const Listr = require('listr');
const ethers = require('ethers');
const utils = require('ethers/utils');
const {keccak256} = require('web3-utils');
const chalk = require('chalk');
const {RLP} = utils;

const {
    dao,
    acl,
    voting,
    token_manager,
    delay_time,
    admin,
    agent,
    stake_token,
    request_token,
    decay,
    ratio,
    weight,
    ANY_ADDRESS,
    environment 
} = require('./settings.json')
const provider = ethers.getDefaultProvider(environment);

const url = chalk.green


// new apps
const delayAppId = '0x1c2b93ad1c4d4302f0169c8f596ce518e4a3324b1fed90c2d80a549a072bcd4e';
const delayBase = (environment === 'rinkeby') 
    ? '0x214044cc3fa7a3ECEF0bC9052Fe9B296585E3275'
    : '0x07759C39BbC1F88CA6b61B5EF500472Ca606DF89'
let delay;

const convictionAppId = '0x589851b3734f6578a92f33bfc26877a1166b95238be1f484deeaac6383d14c38';
const convictionBase = (environment === 'rinkeby') 
    ? '0xE38c3B8FAE63680AEc7a5a62B0a2D25C3E298b1d'
    : '0x5e4fe2bcc0F99E69191e7c8C41EB7e749c31eDd4'
let conviction;

const harbergerAppId = (environment === 'rinkeby') 
    ? '0x589851b3734f6578a92f33bfc26877a1166b95238be1f484deeaac6383d14c38'
    : '0xe2998d9700224635282e9c2da41222441463aa25bcf3bb5252b716e3c6045f95'
const harbergerBase = (environment === 'rinkeby') 
    ? '0x2f0920E5A09F5bc05Fd5320E96E9F4912CD646d0'
    : '0x5729ea9eD77EDD74F6Af0f364B156f726Cdc3651'
let harberger;

// signatures
const newAppInstanceSignature = 'newAppInstance(bytes32,address,bytes,bool)';
const createPermissionSignature = 'createPermission(address,address,bytes32,address)';
const grantPermissionSignature = 'grantPermission(address,address,bytes32)'; 
const delayInitSignature = 'initialize(uint64)'; 
const harbergerInitSignature = 'initialize(address)';
const convictionInitSignature = 'initialize(address,address,address)'; 
const tokenMintSignature = 'mint(address,uint256)';



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
    const nonce2 = await buildNonceForAddress(dao, 1, provider);
    conviction = await calculateNewProxyAddress(dao, nonce2);
    const nonce3 = await buildNonceForAddress(dao, 2, provider);
    harberger = await calculateNewProxyAddress(dao, nonce3);
  

    // app initialisation payloads
    const delayInitPayload = await encodeActCall(delayInitSignature, [
        delay_time
    ])

    const convictionInitPayload = await encodeActCall(convictionInitSignature, [
        stake_token,
        agent,
        request_token
    ])

    const harbergerInitPayload = await encodeActCall(harbergerInitSignature, [token_manager]);


    // 1. install delay
    // 2. convitiction voting
    // 3. harbergere
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
            admin,
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
        ]),
        encodeActCall(grantPermissionSignature, [
            delay,
            agent,
            keccak256('TRANSFER_ROLE'),
        ]),
        encodeActCall(newAppInstanceSignature, [
            convictionAppId,
            convictionBase,
            convictionInitPayload,
            true,
        ]),        
        encodeActCall(createPermissionSignature, [
            ANY_ADDRESS,
            conviction,
            keccak256('CREATE_PROPOSALS_ROLE'),
            voting,
        ]),
        encodeActCall(grantPermissionSignature, [
            conviction,
            agent,
            keccak256('TRANSFER_ROLE'),
        ]),
        encodeActCall(tokenMintSignature, [
            agent,
            "58000000000000000000000",
        ]),
        encodeActCall(tokenMintSignature, [
            "0x9ac9c636404C8d46D9eb966d7179983Ba5a3941A",
            "1000000000000000000000",
        ]),
        encodeActCall(tokenMintSignature, [
            "0xF62af1aE0aA967EE61d36F26DAe2a79f0DE929d4",
            "1000000000000000000000",
        ]),
        encodeActCall(tokenMintSignature, [
            "0x6b817156A65615F01949EaE47CC66f2a1f2F2e7D",
            "1000000000000000000000",
        ]),
        encodeActCall(tokenMintSignature, [
            "0xb68F52FE2583b5a568E7E57dc98c69d93821f6e4",
            "1000000000000000000000",
        ]),
        encodeActCall(tokenMintSignature, [
            "0x75B98710D5995AB9992F02492B7568b43133161D",
            "1000000000000000000000",
        ]),
        encodeActCall(tokenMintSignature, [
            "0x6484c8E807E596beFFc0b9D3AcCB6FF14fCBB180",
            "1000000000000000000000",
        ]),
        encodeActCall(tokenMintSignature, [
            '0xCea5E66bec5193e5eC0b049a3Fe5d7Dd896fD480',
            "1000000000000000000000",
        ]),
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
        },
        {
            to: acl,
            calldata: calldatum[4],
        },
        {
            to: acl,
            calldata: calldatum[5],
        },
        {
            to: acl,
            calldata: calldatum[6],
        },
        {
            to: dao,
            calldata: calldatum[7],
        },
        {
            to: acl,
            calldata: calldatum[8],
        },
        {
            to: acl,
            calldata: calldatum[9],
        },
        {
            to: token_manager,
            calldata: calldatum[10]
        },
        {
            to: token_manager,
            calldata: calldatum[11]
        },
        {
            to: token_manager,
            calldata: calldatum[12]
        },
        {
            to: token_manager,
            calldata: calldatum[13]
        },
        {
            to: token_manager,
            calldata: calldatum[14]
        },
        {
            to: token_manager,
            calldata: calldatum[15]
        },
        {
            to: token_manager,
            calldata: calldatum[16]
        },
        {
            to: token_manager,
            calldata: calldatum[17]
        },
        {
            to: dao,
            calldata: calldatum[18],
        },
        {
            to: acl,
            calldata: calldatum[19],
        },
        {
            to: acl,
            calldata: calldatum[20],
        },
        {
            to: acl,
            calldata: calldatum[21],
        },
        {
            to: acl,
            calldata: calldatum[22],
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