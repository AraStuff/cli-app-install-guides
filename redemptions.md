# Redemptions

## Getting started

Three permissions need to be created for the Redemptions app to function properly:

* `REDEEM_ROLE`
* `ADD_TOKEN_ROLE`
* `REMOVE_TOKEN_ROLE`

The Redemptions app must also have the `TRANSFER_ROLE` permission on Vault and the `BURN_ROLE` permission on the Token Manager.

> **NOTE** if `TRANSFER_ROLE` and `BURN_ROLE` are not already set you must use `acl create`.

<br>

## 1. Set envoronment variables 

```bash
f="--env aragon:rinkeby"
ANY_ADDRESS=0xffffffffffffffffffffffffffffffffffffffff
dao=
vault=
tokenManager=
voting=
redemptions="NEW_REDEMPTIONS_ADDRESS"
```

A line break after a command for eg. `dao new $f`, this means you must create an environment variable, you can stores these in the block provided. Commands without line breaks can be run as pasted into the terminal together and run synchronously.

<br>

## 2. Install app

These commands will trigger votes that the DAO needs to approve (probably via a vote in the client).

The redeamable token address needs to be a valid token contract on the network that the DAO is on (Rinkeby or mainnet).

```bash
aragon dao install $dao redemptions.aragonpm.eth --app-init-args $vault $tokenManager ["'Redemable_Token_Address1', 'Redemable_Token_Address2'"] $f
```

Get the redemptions address and add it to the environment variables.

```bash
dao apps $dao --all $f
redemptions="NEW_REDEMPTIONS_ADDRESS"
```

Install app permissions.
```bash
dao acl create $dao $redemptions REDEEM_ROLE $ANY_ADDRESS $voting $f
dao acl create $dao $redemptions ADD_TOKEN_ROLE $voting $voting $f
dao acl create $dao $redemptions REMOVE_TOKEN_ROLE $voting $voting $f
dao acl grant $dao $vault TRANSFER_ROLE $redemptions $f
dao acl grant $dao $tokenManager BURN_ROLE $redemptions $f
```

Note: if you want to add ETH as a redeemable token use `0x0000000000000000000000000000000000000000` for the address.

<br>

## More info

More info on the Redemptions app can be found in the [1Hive Redemptions GitHub repo](https://github.com/1Hive/redemptions-app).
